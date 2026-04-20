import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Spanner } from "@google-cloud/spanner";
import { defineSecret } from "firebase-functions/params";
import { timingSafeEqual } from "node:crypto";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import {
    allGateCoordinates,
    computeGateEtas,
    computePriorityRoute,
    destinationForGate,
    normalizeGateId,
    PARKING_LOT_ORIGIN,
    searchNearbyAmenities as searchNearbyAmenitiesPlatform,
    type RoutePriority,
} from "./mapsPlatform";
import {
    sendCongestionNudgesToTokens,
    sendEmergencyTopicMessage,
    sendSmartRerouteTopicMessage,
} from "./fcmHelpers";
import { translateText, type TranslationLangCode } from "./translation";
import {
    BroadcastEmergencyBodySchema,
    CalculateOptimalPathBodySchema,
    parseJsonBody,
    RegisterFcmTopicsBodySchema,
    ReserveSlotSchema,
    SearchNearbyAmenitiesBodySchema,
    TranslateAlertBodySchema,
    VertexAggregatorBodySchema,
} from "./validation";
import { enforceHttpRateLimit } from "./httpRateLimit";
import { evaluateArrivalWindowRow, type ArrivalWindowRow } from "./bookingCapacity";
import { isRoutingPolicyRoleAllowed } from "./routingPolicyAuth";
import { sanitizeHttpErrorDetail } from "./sanitizeHttpError";

admin.initializeApp();

const mapsPlatformKey = defineSecret("MAPS_PLATFORM_KEY");
const emergencyBroadcastKey = defineSecret("EMERGENCY_BROADCAST_KEY");
const vertexIngestKey = defineSecret("VERTEX_INGEST_KEY");
const translationApiKey = defineSecret("TRANSLATION_API_KEY");

/**
 * Emulator: mock routing/vertex paths default ON (`USE_MOCK_DATA` unset or not `false`).
 * Production: mock only when `USE_MOCK_DATA=true` (set in Cloud Functions runtime env).
 */
const USE_MOCK_DATA =
    process.env.FUNCTIONS_EMULATOR === "true"
        ? process.env.USE_MOCK_DATA !== "false"
        : process.env.USE_MOCK_DATA === "true";

/** Constant-time UTF-8 string comparison (length mismatch returns false without timingSafeEqual). */
function safeEqualUtf8(provided: string | undefined, expected: string): boolean {
    const a = Buffer.from(provided ?? "", "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) {
        return false;
    }
    return timingSafeEqual(a, b);
}

type AuditSeverity = "INFO" | "NOTICE" | "ERROR";

interface AuditJsonPayload {
    severity: AuditSeverity;
    action: string;
    /** BQ sink / log explorer: MATRIX_RANKING | TARGETED_NUDGE | A11Y_TRANSLATION */
    category?: string;
    [key: string]: unknown;
}

/**
 * Single-line JSON for Cloud Logging Explorer (filter on `jsonPayload.action` / `severity`).
 */
function logAuditJson(payload: AuditJsonPayload): void {
    const line = JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
    });
    if (payload.severity === "ERROR") {
        functions.logger.error(line);
    } else {
        functions.logger.info(line);
    }
}

/**
 * Analytical Path: Spanner Transactional Booking
 * Proxies the request to Cloud Spanner (instance `adaptive-entry-instance`, database `entry-routing-db`)
 * to ensure strong consistency prevents overbooking.
 */
export const reserveEntrySlot = functions.https.onCall({ secrets: [mapsPlatformKey] }, async (request) => {
    if (!request.auth) {
        logAuditJson({
            severity: "NOTICE",
            action: "SLOT_RESERVATION_DENIED",
            reason: "unauthenticated",
        });
        throw new functions.https.HttpsError("unauthenticated", "Request had no identity credentials.");
    }

    const parsed = parseJsonBody(request.data, ReserveSlotSchema);
    if (!parsed.ok) {
        logAuditJson({
            severity: "NOTICE",
            action: "SLOT_RESERVATION_INVALID",
            reason: "validation_failed",
            uid: request.auth.uid,
        });
        throw new functions.https.HttpsError("invalid-argument", "Invalid slot or gate format.");
    }
    const { slotId, gateId } = parsed.data;

    const uid = request.auth.uid;

    logAuditJson({
        severity: "INFO",
        action: "SLOT_RESERVATION_ATTEMPT",
        slotId,
        gateId,
        uid,
    });

    const spanner = new Spanner();
    const instance = spanner.instance("adaptive-entry-instance");
    const database = instance.database("entry-routing-db");

    try {
        await database.runTransactionAsync(async (transaction) => {
            const [rows] = await transaction.run({
                sql: `SELECT capacity_reserved, max_capacity FROM ArrivalWindows WHERE slot_id = @slotId`,
                params: { slotId }
            });

            const evaluation = evaluateArrivalWindowRow(rows as ArrivalWindowRow[]);
            if (!evaluation.ok) {
                if (evaluation.reason === "no_slot") {
                    throw new functions.https.HttpsError(
                        "failed-precondition",
                        "This time slot is not available for booking."
                    );
                }
                throw new Error("CAPACITY_EXHAUSTED");
            }

            await transaction.run({
                sql: `UPDATE ArrivalWindows SET capacity_reserved = capacity_reserved + 1 WHERE slot_id = @slotId`,
                params: { slotId }
            });

            await transaction.commit();
        });
        const transactionId = `slot-${slotId}-${Date.now().toString(36)}`;
        logAuditJson({
            severity: "INFO",
            action: "SLOT_RESERVATION_SUCCESS",
            slotId,
            gateId,
            uid,
        });
        return {
            status: "SUCCESS",
            message: "Slot reserved.",
            transactionId
        };
    } catch (e: any) {
        if (e instanceof functions.https.HttpsError) {
            throw e;
        }
        if (e?.message === "CAPACITY_EXHAUSTED") {
            logAuditJson({
                severity: "NOTICE",
                action: "SLOT_RESERVATION_CAPACITY_EXHAUSTED",
                slotId,
                gateId,
                uid,
            });
            throw new functions.https.HttpsError(
                "resource-exhausted",
                "Capacity exhausted for this slot."
            );
        }
        logAuditJson({
            severity: "ERROR",
            action: "SLOT_RESERVATION_SPANNER_FAILURE",
            slotId,
            gateId,
            uid,
            errorCode: "SPANNER_TRANSACTION_FAILED",
        });
        functions.logger.error("[reserveEntrySlot] Spanner transaction failed", e);
        throw new functions.https.HttpsError(
            "internal",
            "Reservation could not be completed. Try again later."
        );
    }
});

/**
 * Analytical Path: Traffic-Aware Routing (Maps API Wrapper)
 * Factors Perimeter-to-Seat time minimizing congestion, consuming identity constraints.
 */
const MOCK_POLYLINE =
    "_p~iF~ps|U_ulLnnqC_mqNvxq`@";

export const calculateOptimalPath = functions.https.onCall(
    { secrets: [mapsPlatformKey] },
    async (request) => {
        if (!request.auth) {
            logAuditJson({
                severity: "NOTICE",
                action: "ROUTES_CALL_UNAUTHENTICATED",
            });
            throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
        }

        const bodyParsed = parseJsonBody(request.data ?? {}, CalculateOptimalPathBodySchema);
        if (!bodyParsed.ok) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid route request payload.");
        }
        const { originLat, originLng, destinationGate, stepFreeRequired, priority, returnToVehicle } =
            bodyParsed.data;

        const oLat = typeof originLat === "number" ? originLat : Number(originLat);
        const oLng = typeof originLng === "number" ? originLng : Number(originLng);
        if (!Number.isFinite(oLat) || !Number.isFinite(oLng)) {
            logAuditJson({
                severity: "NOTICE",
                action: "ROUTES_CALL_INVALID_ORIGIN",
                uid: request.auth.uid,
            });
            throw new functions.https.HttpsError("invalid-argument", "originLat and originLng required.");
        }

        const gate = destinationGate ?? "GATE_B";
        const returnVehicle = Boolean(returnToVehicle);
        const dest = returnVehicle
            ? { latitude: PARKING_LOT_ORIGIN.latitude, longitude: PARKING_LOT_ORIGIN.longitude }
            : destinationForGate(gate);
        const stepFree = Boolean(stepFreeRequired);
        let prio: RoutePriority =
            priority === "vip" || priority === "emergency" || priority === "standard"
                ? priority
                : "standard";
        if (returnVehicle) {
            prio = "standard";
        }

        async function writeEmergencyClearZone(): Promise<void> {
            await admin.firestore().collection("routingPolicy").doc("live").set(
                {
                    clearZoneActive: true,
                    clearZoneSectors: ["TUNNEL_ACCESS_N", "SERVICE_RING_W"],
                    priorityMeshSource: "emergency_route",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
        }

        if (USE_MOCK_DATA) {
            functions.logger.info(
                `[MOCK] Routing to ${returnVehicle ? "PARKING" : gate}. Step-Free: ${stepFree} priority=${prio}`
            );
            const seatTime = returnVehicle
                ? "9 mins to lot"
                : prio === "emergency"
                  ? "6 mins drive"
                  : prio === "vip"
                    ? "14 mins (suite)"
                    : stepFree
                      ? "18 mins"
                      : "12 mins";

            const mockPoly = MOCK_POLYLINE;

            logAuditJson({
                severity: "INFO",
                action: "Path_Calculated",
                mode: "mock",
                destinationGate: returnVehicle ? "PARKING_LOT" : gate,
                returnToVehicle,
                stepFreeRequired: stepFree,
                priority: prio,
            });

            if (prio === "emergency") {
                await writeEmergencyClearZone();
            }

            return {
                routeId: "rt-mock-" + Date.now(),
                encodedPolyline: mockPoly,
                distanceMeters: prio === "emergency" ? 890 : prio === "vip" ? 510 : 420,
                durationSeconds: prio === "emergency" ? 360 : prio === "vip" ? 840 : stepFree ? 1080 : 720,
                pathNodes: returnVehicle
                    ? [
                          { lat: oLat, lng: oLng, description: "Current Location" },
                          { lat: dest.latitude, lng: dest.longitude, description: "Parking zone" },
                      ]
                    : [
                          { lat: oLat, lng: oLng, description: "Current Location" },
                          { lat: 34.0522, lng: -118.2437, description: stepFree ? "Elevator Bank C" : "Stairwell B" },
                          { lat: dest.latitude, lng: dest.longitude, description: gate },
                      ],
                perimeterToSeatTime: seatTime,
                status: "MOCK_ROUTING",
                priority: prio,
            };
        }

        const apiKey = mapsPlatformKey.value();
        if (!apiKey) {
            logAuditJson({
                severity: "ERROR",
                action: "ROUTES_MISSING_MAPS_KEY",
                uid: request.auth.uid,
            });
            throw new functions.https.HttpsError("failed-precondition", "Maps platform key not configured.");
        }

        try {
            const route = await computePriorityRoute({
                apiKey,
                originLat: oLat,
                originLng: oLng,
                destLat: dest.latitude,
                destLng: dest.longitude,
                stepFreeRequired: stepFree,
                priority: prio,
            });

            if (prio === "emergency") {
                await writeEmergencyClearZone();
                logAuditJson({
                    severity: "INFO",
                    action: "PRIORITY_CLEAR_ZONE_WRITTEN",
                    uid: request.auth.uid,
                    sectors: ["TUNNEL_ACCESS_N", "SERVICE_RING_W"],
                });
            }

            const mins = Math.max(1, Math.round(route.durationSeconds / 60));

            logAuditJson({
                severity: "INFO",
                action: "Path_Calculated",
                mode: "routes_api_v2",
                destinationGate: returnVehicle ? "PARKING_LOT" : normalizeGateId(gate),
                returnToVehicle: returnVehicle,
                distanceMeters: route.distanceMeters,
                durationSeconds: route.durationSeconds,
                stepFreeRequired: stepFree,
                priority: prio,
                uid: request.auth.uid,
            });

            return {
                routeId: "rt-" + Date.now(),
                encodedPolyline: route.encodedPolyline,
                distanceMeters: route.distanceMeters,
                durationSeconds: route.durationSeconds,
                pathNodes: [
                    { lat: oLat, lng: oLng, description: "Origin" },
                    {
                        lat: dest.latitude,
                        lng: dest.longitude,
                        description: returnVehicle ? "Parking zone" : gate,
                    },
                ],
                perimeterToSeatTime: `${mins} mins`,
                status: "ROUTES_API_OK",
                priority: prio,
            };
        } catch (e: any) {
            logAuditJson({
                severity: "ERROR",
                action: "ROUTES_API_FAILURE",
                message: String(e?.message ?? e),
                destinationGate: gate,
                uid: request.auth.uid,
            });
            functions.logger.error("[calculateOptimalPath] Routes API error", e);
            throw new functions.https.HttpsError(
                "internal",
                "Unable to compute walking route. Try again shortly."
            );
        }
    }
);

/**
 * Places API (New) — concourse / amenity hints for attendee dashboard (server holds API key).
 */
export const searchNearbyAmenities = functions.https.onCall(
    { secrets: [mapsPlatformKey] },
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
        }

        const placesParsed = parseJsonBody(request.data ?? {}, SearchNearbyAmenitiesBodySchema);
        if (!placesParsed.ok) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid places request payload.");
        }
        const { latitude, longitude, wheelchairAccessibleOnly } = placesParsed.data;

        const lat = typeof latitude === "number" ? latitude : Number(latitude);
        const lng = typeof longitude === "number" ? longitude : Number(longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new functions.https.HttpsError("invalid-argument", "latitude and longitude required.");
        }

        const apiKey = mapsPlatformKey.value();
        if (!apiKey) {
            logAuditJson({
                severity: "ERROR",
                action: "PLACES_MISSING_MAPS_KEY",
                uid: request.auth.uid,
            });
            throw new functions.https.HttpsError("failed-precondition", "Maps platform key not configured.");
        }

        try {
            const result = await searchNearbyAmenitiesPlatform({
                apiKey,
                latitude: lat,
                longitude: lng,
                wheelchairAccessibleOnly: Boolean(wheelchairAccessibleOnly),
            });

            logAuditJson({
                severity: "INFO",
                action: "PLACES_NEARBY_OK",
                uid: request.auth.uid,
                resultCount: result.places.length,
            });

            return result;
        } catch (e: any) {
            logAuditJson({
                severity: "ERROR",
                action: "PLACES_API_FAILURE",
                message: String(e?.message ?? e),
                uid: request.auth.uid,
            });
            functions.logger.error("[searchNearbyAmenities] Places API error", e);
            throw new functions.https.HttpsError(
                "internal",
                "Unable to load nearby places. Try again shortly."
            );
        }
    }
);

/**
 * Design 5 / Paradigm 2: Distance Matrix — rank gates by walking ETA from the attendee origin.
 */
function parseOriginFromRequest(data: Record<string, unknown> | undefined): { lat: number; lng: number } | null {
    if (!data) return null;
    const o = data.origin;
    if (o && typeof o === "object" && o !== null) {
        const obj = o as Record<string, unknown>;
        if (typeof obj.lat === "number" && typeof obj.lng === "number") {
            return { lat: obj.lat, lng: obj.lng };
        }
        if (typeof obj.latitude === "number" && typeof obj.longitude === "number") {
            return { lat: obj.latitude, lng: obj.longitude };
        }
    }
    const oLat = data.originLat ?? data.latitude;
    const oLng = data.originLng ?? data.longitude;
    const lat = typeof oLat === "number" ? oLat : Number(oLat);
    const lng = typeof oLng === "number" ? oLng : Number(oLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
    }
    return null;
}

export const getGateEtasMatrix = functions.https.onCall({ secrets: [mapsPlatformKey] }, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const parsed = parseOriginFromRequest(request.data as Record<string, unknown> | undefined);
    if (!parsed) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Origin required: request.data.origin { lat, lng } or originLat/originLng."
        );
    }
    const oLat = parsed.lat;
    const oLng = parsed.lng;

    const snap = await admin.firestore().collection("gateLogistics").get();
    let gates = allGateCoordinates();
    if (!snap.empty) {
        const ids = new Set(snap.docs.map((d) => normalizeGateId(d.id)));
        gates = allGateCoordinates().filter((g) => ids.has(g.gateId));
        if (gates.length === 0) {
            gates = allGateCoordinates();
        }
    }

    if (USE_MOCK_DATA) {
        const mock = gates
            .map((g, i) => ({
                gateId: g.gateId,
                durationSeconds: 180 + i * 45,
                distanceMeters: 200 + i * 50,
            }))
            .sort((a, b) => a.durationSeconds - b.durationSeconds);
        logAuditJson({
            severity: "INFO",
            category: "MATRIX_RANKING",
            action: "GATE_ETA_MATRIX_MOCK",
            uid: request.auth.uid,
            count: mock.length,
            originLat: oLat,
            originLng: oLng,
        });
        return { rankings: mock, mode: "mock" as const };
    }

    const apiKey = mapsPlatformKey.value();
    if (!apiKey) {
        throw new functions.https.HttpsError("failed-precondition", "Maps API key not configured.");
    }
    try {
        const rankings = await computeGateEtas({
            apiKey,
            originLat: oLat,
            originLng: oLng,
            gates,
        });
        logAuditJson({
            severity: "INFO",
            category: "MATRIX_RANKING",
            action: "GATE_ETA_MATRIX_OK",
            uid: request.auth.uid,
            count: rankings.length,
            originLat: oLat,
            originLng: oLng,
        });
        return { rankings, mode: "distance_matrix" as const };
    } catch (e: any) {
        logAuditJson({
            severity: "ERROR",
            category: "MATRIX_RANKING",
            action: "GATE_ETA_MATRIX_FAILURE",
            message: String(e?.message ?? e),
            uid: request.auth.uid,
        });
        throw new functions.https.HttpsError("internal", "Unable to compute gate rankings.");
    }
});

/**
 * Translate alerts / policy copy for demo locales (English, Hindi, Telugu).
 */
export const translateAlert = functions.https.onCall({ secrets: [translationApiKey] }, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const trParsed = parseJsonBody(request.data ?? {}, TranslateAlertBodySchema);
    if (!trParsed.ok) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid translation request payload.");
    }
    const { text, target, source } = trParsed.data;
    const raw = typeof text === "string" ? text : "";
    const tgt = (target === "hi" || target === "te" || target === "en" ? target : "en") as TranslationLangCode;

    let translationKey = "";
    try {
        translationKey = translationApiKey.value() ?? "";
    } catch {
        translationKey = "";
    }

    if (USE_MOCK_DATA || !translationKey) {
        const prefix = tgt === "hi" ? "[HI] " : tgt === "te" ? "[TE] " : "";
        logAuditJson({
            severity: "INFO",
            category: "A11Y_TRANSLATION",
            action: "TRANSLATE_ALERT_MOCK",
            uid: request.auth.uid,
            target: tgt,
        });
        return { translatedText: tgt === "en" ? raw : prefix + raw, mode: "mock" as const };
    }

    try {
        const srcLang =
            source === "hi" || source === "te" || source === "en" ? source : "en";
        const translatedText = await translateText({
            apiKey: translationKey,
            text: raw,
            target: tgt,
            source: srcLang,
        });
        logAuditJson({
            severity: "INFO",
            category: "A11Y_TRANSLATION",
            action: "TRANSLATE_ALERT_OK",
            uid: request.auth.uid,
            target: tgt,
        });
        return { translatedText, mode: "translate_api" as const };
    } catch (e: any) {
        logAuditJson({
            severity: "ERROR",
            category: "A11Y_TRANSLATION",
            action: "TRANSLATE_ALERT_FAILURE",
            message: String(e?.message ?? e),
            uid: request.auth.uid,
        });
        throw new functions.https.HttpsError("internal", "Translation failed.");
    }
});

const ROUTING_POLICY_MERGE_KEYS = new Set([
    "gateRerouteActive",
    "fromGate",
    "toGate",
    "message",
    "emergency_vehicle_active",
    "clearZoneActive",
    "clearZoneSectors",
    "autoTriggered",
]);

/**
 * Staff/ops: merge `routingPolicy/live` (clients cannot write Firestore directly — rules deny writes).
 * Production: Firebase Auth custom claim `role` must be `staff` or `admin`.
 * Emulator: any authenticated user (local demo without claims).
 */
export const updateRoutingPolicyLive = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const emulator = process.env.FUNCTIONS_EMULATOR === "true";
    const role = (request.auth.token as { role?: string }).role;
    if (!isRoutingPolicyRoleAllowed(emulator, role)) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Staff or admin custom claim (role) required to update routing policy."
        );
    }
    const raw = request.data;
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new functions.https.HttpsError("invalid-argument", "Object payload required.");
    }
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (ROUTING_POLICY_MERGE_KEYS.has(k)) {
            cleaned[k] = v;
        }
    }
    cleaned.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await admin.firestore().collection("routingPolicy").doc("live").set(cleaned, { merge: true });
    logAuditJson({
        severity: "INFO",
        action: "ROUTING_POLICY_MERGED",
        uid: request.auth.uid,
        keys: Object.keys(cleaned).filter((x) => x !== "updatedAt"),
    });
    return { ok: true };
});

/**
 * Subscribe device FCM token to `emergency` + `smart_reroute` topics (server-side; required for web).
 */
export const registerFcmTopics = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const fcmParsed = parseJsonBody(request.data ?? {}, RegisterFcmTopicsBodySchema);
    if (!fcmParsed.ok) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid FCM registration payload.");
    }
    const { token } = fcmParsed.data;
    if (!token || typeof token !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "FCM registration token required.");
    }
    try {
        await admin.messaging().subscribeToTopic([token], "emergency");
        await admin.messaging().subscribeToTopic([token], "smart_reroute");
        await admin
            .firestore()
            .collection("users")
            .doc(request.auth.uid)
            .set(
                {
                    fcmToken: token,
                    fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
        logAuditJson({ severity: "INFO", category: "TARGETED_NUDGE", action: "FCM_TOPIC_SUBSCRIBE", uid: request.auth.uid });
        return { ok: true, topics: ["emergency", "smart_reroute"] as const };
    } catch (e: any) {
        logAuditJson({
            severity: "ERROR",
            action: "FCM_TOPIC_SUBSCRIBE_FAILURE",
            message: String(e?.message ?? e),
            uid: request.auth.uid,
        });
        throw new functions.https.HttpsError("internal", "Unable to subscribe to FCM topics.");
    }
});

/**
 * Paradigm 4 / 5: Auto reroute when any gate in `gateLogistics` crosses >85% pressure.
 */
export const onGatePressureChange = onDocumentUpdated(
    {
        document: "gateLogistics/{gateId}",
        region: "us-central1",
    },
    async (event) => {
        const gateId = String(event.params.gateId);
        const before = event.data?.before.data() as { pressurePercent?: number; currentPressure?: number } | undefined;
        const after = event.data?.after.data() as { pressurePercent?: number; currentPressure?: number } | undefined;

        const prev =
            typeof before?.pressurePercent === "number"
                ? before.pressurePercent
                : typeof before?.currentPressure === "number"
                  ? before.currentPressure
                  : null;
        const curr =
            typeof after?.pressurePercent === "number"
                ? after.pressurePercent
                : typeof after?.currentPressure === "number"
                  ? after.currentPressure
                  : null;

        if (curr == null || !Number.isFinite(curr)) {
            return;
        }
        const crossed = (prev == null || prev <= 85) && curr > 85;
        if (!crossed) {
            return;
        }

        const fromG = normalizeGateId(gateId);
        const alternate =
            fromG === "GATE_A" ? "GATE_B" : fromG === "GATE_B" ? "GATE_C" : "GATE_A";

        try {
            await admin.firestore().collection("routingPolicy").doc("live").set(
                {
                    gateRerouteActive: true,
                    fromGate: fromG,
                    toGate: alternate,
                    message:
                        "SYSTEM: High gate pressure detected. Follow the smart route to reduce concourse load.",
                    autoTriggered: true,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
            logAuditJson({
                severity: "NOTICE",
                action: "AUTO_REROUTE_PRESSURE",
                gateId: fromG,
                pressurePercent: curr,
            });

            try {
                const usersSnap = await admin
                    .firestore()
                    .collection("users")
                    .where("currentLocationZone", "==", fromG)
                    .get();

                const zoneDocs = usersSnap.docs;
                const BATCH_CAP = 450;
                for (let i = 0; i < zoneDocs.length; i += BATCH_CAP) {
                    const slice = zoneDocs.slice(i, i + BATCH_CAP);
                    const incentiveBatch = admin.firestore().batch();
                    slice.forEach((d) => {
                        incentiveBatch.set(
                            d.ref,
                            {
                                pendingVoucherCode: "SMART_MOVE_10",
                                pendingVoucherAt: admin.firestore.FieldValue.serverTimestamp(),
                            },
                            { merge: true }
                        );
                    });
                    await incentiveBatch.commit();
                }

                const tokens: string[] = [];
                usersSnap.forEach((d) => {
                    const t = d.get("fcmToken");
                    if (typeof t === "string" && t.length > 8) {
                        tokens.push(t);
                    }
                });
                const unique = [...new Set(tokens)];
                if (unique.length === 0) {
                    logAuditJson({
                        severity: "INFO",
                        category: "TARGETED_NUDGE",
                        action: "SEGMENTED_CONGESTION_SKIP",
                        gateId: fromG,
                        reason: "no_tokens_in_zone",
                    });
                } else {
                    const { successCount, failureCount } = await sendCongestionNudgesToTokens(
                        unique,
                        fromG,
                        "SMART_MOVE_10"
                    );
                    logAuditJson({
                        severity: "INFO",
                        category: "TARGETED_NUDGE",
                        action: "SEGMENTED_CONGESTION_NUDGE",
                        gateId: fromG,
                        tokenTargets: unique.length,
                        successCount,
                        failureCount,
                    });
                }
            } catch (nudgeErr: any) {
                logAuditJson({
                    severity: "ERROR",
                    category: "TARGETED_NUDGE",
                    action: "SEGMENTED_CONGESTION_NUDGE_FAILURE",
                    gateId: fromG,
                    message: String(nudgeErr?.message ?? nudgeErr),
                });
                functions.logger.error("[onGatePressureChange] segmented FCM failed", nudgeErr);
            }
        } catch (e: any) {
            functions.logger.error("[onGatePressureChange] Firestore merge failed", e);
        }
    }
);

/**
 * FCM nudge when `routingPolicy/live` enables smart reroute (staff or automated).
 */
export const onRoutingPolicyRerouteNotify = onDocumentUpdated(
    {
        document: "routingPolicy/{docId}",
        region: "us-central1",
    },
    async (event) => {
        if (String(event.params.docId) !== "live") {
            return;
        }
        const before = event.data?.before.data() as { gateRerouteActive?: boolean; message?: string } | undefined;
        const after = event.data?.after.data() as
            | { gateRerouteActive?: boolean; message?: string; autoTriggered?: boolean }
            | undefined;

        const was = before?.gateRerouteActive === true;
        const now = after?.gateRerouteActive === true;
        if (!now || was) {
            return;
        }
        try {
            await sendSmartRerouteTopicMessage({
                message: typeof after?.message === "string" ? after.message : undefined,
                source: after?.autoTriggered === true ? "auto" : "staff",
            });
            logAuditJson({ severity: "INFO", action: "FCM_SMART_REROUTE_SENT", source: after?.autoTriggered ? "auto" : "staff" });
        } catch (e: any) {
            functions.logger.error("[onRoutingPolicyRerouteNotify] FCM send failed", e);
        }
    }
);

/**
 * Analytical Path: Vertex AI Vision Aggregator
 * Ingest is authenticated via `VERTEX_INGEST_KEY` (header `x-vertex-ingest-key` or body `ingestKey`).
 * Emulator: optional `MOCK_VERTEX_INGEST_KEY` (constant-time), not for production.
 */
export const vertexAggregator = onRequest(
    { secrets: [vertexIngestKey], region: "us-central1", cors: false },
    async (req, res) => {
        const deploymentMode =
            process.env.FUNCTIONS_EMULATOR === "true" ? "EMULATOR_MODE" : "PRODUCTION_MODE";
        functions.logger.info(`[AUDIT] vertexAggregator deployment=${deploymentMode} phase=auth_check`);

        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        if (!enforceHttpRateLimit(req, res, "vertexAggregator")) {
            return;
        }

        const rawBody = req.body && typeof req.body === "object" ? req.body : {};
        const bodyParsed = parseJsonBody(rawBody, VertexAggregatorBodySchema);
        if (!bodyParsed.ok) {
            res.status(400).json({
                error: "invalid_body",
                detail: sanitizeHttpErrorDetail(bodyParsed.error),
            });
            return;
        }
        const payload = bodyParsed.data;

        const rawHeader = req.headers["x-vertex-ingest-key"];
        const headerKey = typeof rawHeader === "string" ? rawHeader : Array.isArray(rawHeader) ? rawHeader[0] : undefined;
        const bodyKey = typeof payload.ingestKey === "string" ? payload.ingestKey : undefined;
        const provided = headerKey ?? bodyKey;

        const expected = vertexIngestKey.value();
        const emulatorMode = process.env.FUNCTIONS_EMULATOR === "true";
        const prodAuthorized = safeEqualUtf8(provided, expected);
        const emulatorMockAuthorized =
            emulatorMode && safeEqualUtf8(provided, "MOCK_VERTEX_INGEST_KEY");
        const authorized = prodAuthorized || emulatorMockAuthorized;

        if (!authorized) {
            logAuditJson({
                severity: "ERROR",
                action: "VERTEX_INGEST_UNAUTHORIZED",
                deployment: deploymentMode,
            });
            res.status(401).send("Unauthorized");
            return;
        }

        if (emulatorMode && emulatorMockAuthorized) {
            functions.logger.warn(
                `[AUDIT] vertexAggregator deployment=EMULATOR_MODE auth=MOCK_VERTEX_INGEST_KEY note=not_for_production`
            );
        }

        function zoneIdToGateId(zoneId: string): string {
            const z = zoneId.trim().toLowerCase().replace(/_/g, "-");
            const map: Record<string, string> = {
                "gate-a": "GATE_A",
                "gate-b": "GATE_B",
                "gate-c": "GATE_C",
                "zone-a": "GATE_A",
                "zone-b": "GATE_B",
                "gate-a-ingress": "GATE_A",
            };
            return map[z] ?? normalizeGateId(zoneId.replace(/-/g, "_").toUpperCase());
        }

        if (USE_MOCK_DATA) {
            const p = payload;
            const heatmapAverage =
                typeof p.averageDensity === "number"
                    ? p.averageDensity
                    : typeof p.count === "number"
                      ? Math.min(100, Math.max(0, p.count))
                      : 85;
            const gateId = p.zoneId ? zoneIdToGateId(String(p.zoneId)) : "GATE_B";

            logAuditJson({
                severity: "INFO",
                action: "VERTEX_INGEST_MOCK",
                gateId,
                pressurePercent: heatmapAverage,
            });

            await admin.firestore().collection("gateLogistics").doc(gateId).set(
                {
                    currentPressure: heatmapAverage,
                    pressurePercent: heatmapAverage,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            res.status(200).send({ status: "Ingested", heatmapAverage, gateId });
            return;
        }

        const ingestPayload = payload;

        if (!ingestPayload.zoneId || typeof ingestPayload.zoneId !== "string") {
            logAuditJson({
                severity: "ERROR",
                action: "VERTEX_INGEST_INVALID",
                reason: "missing_zoneId",
            });
            res.status(400).json({ error: "zoneId is required" });
            return;
        }

        const gateId = zoneIdToGateId(ingestPayload.zoneId);
        const rawCount = ingestPayload.count;
        const explicit = ingestPayload.pressurePercent;

        let pressurePercent: number;
        if (typeof explicit === "number" && Number.isFinite(explicit)) {
            pressurePercent = Math.min(100, Math.max(0, Math.round(explicit)));
        } else if (typeof rawCount === "number" && Number.isFinite(rawCount)) {
            pressurePercent = Math.min(100, Math.max(0, Math.round(rawCount)));
        } else {
            logAuditJson({
                severity: "ERROR",
                action: "VERTEX_INGEST_INVALID",
                reason: "missing_count_or_pressurePercent",
                zoneId: ingestPayload.zoneId,
            });
            res.status(400).json({ error: "count or pressurePercent required" });
            return;
        }

        try {
            await admin.firestore().collection("gateLogistics").doc(gateId).set(
                {
                    pressurePercent,
                    currentPressure: pressurePercent,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                    zoneId: ingestPayload.zoneId,
                    source: "vertex_vision_ingest",
                },
                { merge: true }
            );

            logAuditJson({
                severity: "INFO",
                action: "VERTEX_INGEST_APPLIED",
                gateId,
                pressurePercent,
                zoneId: ingestPayload.zoneId,
            });

            res.status(200).json({ status: "ok", gateId, pressurePercent });
        } catch (e: any) {
            logAuditJson({
                severity: "ERROR",
                action: "VERTEX_INGEST_FIRESTORE_FAILURE",
                gateId,
                message: String(e?.message ?? e),
            });
            functions.logger.error("[vertexAggregator] Firestore write failed", e);
            res.status(500).json({ error: "firestore_write_failed" });
        }
    }
);

/**
 * Safety Mesh: Emergency Broadcast Trigger
 * Validates `key` against Secret Manager `EMERGENCY_BROADCAST_KEY` (set via `firebase functions:secrets:set`).
 * Emulator: set the same secret locally or use `.secret.local` per Firebase docs.
 */
export const broadcastEmergency = onRequest(
    { secrets: [emergencyBroadcastKey], region: "us-central1", cors: false },
    async (req, res) => {
        const deploymentMode =
            process.env.FUNCTIONS_EMULATOR === "true" ? "EMULATOR_MODE" : "PRODUCTION_MODE";
        functions.logger.info(`[AUDIT] broadcastEmergency deployment=${deploymentMode} phase=auth_check`);

        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        if (!enforceHttpRateLimit(req, res, "broadcastEmergency")) {
            return;
        }

        const rawBody = req.body && typeof req.body === "object" ? req.body : {};
        const bodyParsed = parseJsonBody(rawBody, BroadcastEmergencyBodySchema);
        if (!bodyParsed.ok) {
            res.status(400).json({
                error: "invalid_body",
                detail: sanitizeHttpErrorDetail(bodyParsed.error),
            });
            return;
        }
        const { type, location, key } = bodyParsed.data;

        const expected = emergencyBroadcastKey.value();
        const emulatorMode = process.env.FUNCTIONS_EMULATOR === "true";
        const prodAuthorized = safeEqualUtf8(key, expected);
        const emulatorMockAuthorized = emulatorMode && safeEqualUtf8(key, "MOCK_SECRET_KEY");
        const authorized = prodAuthorized || emulatorMockAuthorized;

        if (!authorized) {
            functions.logger.warn(
                `[AUDIT] broadcastEmergency deployment=${deploymentMode} result=unauthorized`
            );
            res.status(401).send("Unauthorized");
            return;
        }

        if (emulatorMode && emulatorMockAuthorized) {
            functions.logger.warn(
                `[AUDIT] broadcastEmergency deployment=EMULATOR_MODE auth=MOCK_SECRET_KEY note=not_for_production`
            );
        }

        functions.logger.info(
            `[AUDIT] broadcastEmergency deployment=${deploymentMode} result=authorized dispatch=firestore`
        );

        const evType = type || "EVACUATION";
        const evLoc = location || "ALL";

        await admin.firestore().collection("globalEvents").doc("emergency").set({
            type: evType,
            location: evLoc,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            active: true,
        });

        try {
            await sendEmergencyTopicMessage({ type: evType, location: evLoc });
            functions.logger.info(`[AUDIT] broadcastEmergency FCM topic=emergency dispatched`);
        } catch (fe: any) {
            functions.logger.warn("[broadcastEmergency] FCM topic send failed (Firestore still applied)", fe);
        }

        res.status(200).send({
            message: "Emergency Override dispatched to Firestore edge layer.",
            fcmTopic: "emergency",
        });
    }
);

export { lookupDemoAttendee, reserveDemoSlot } from "./demoCallables";
