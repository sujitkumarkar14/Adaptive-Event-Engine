import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Spanner } from "@google-cloud/spanner";
import { defineSecret } from "firebase-functions/params";
import { timingSafeEqual } from "node:crypto";

admin.initializeApp();

const mapsPlatformKey = defineSecret("MAPS_PLATFORM_KEY");
const emergencyBroadcastKey = defineSecret("EMERGENCY_BROADCAST_KEY");
const vertexIngestKey = defineSecret("VERTEX_INGEST_KEY");

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

    const { slotId, gateId } = request.data as any;
    if (!slotId || !gateId) {
        logAuditJson({
            severity: "NOTICE",
            action: "SLOT_RESERVATION_INVALID",
            reason: "missing_slot_or_gate",
            uid: request.auth.uid,
        });
        throw new functions.https.HttpsError("invalid-argument", "Missing slot or gate specifiers.");
    }

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

            if (!rows.length) {
                throw new Error("CAPACITY_EXHAUSTED");
            }
            const first = rows[0] as { capacity_reserved: number; max_capacity: number };
            if (first.capacity_reserved >= first.max_capacity) {
                throw new Error("CAPACITY_EXHAUSTED");
            }

            await transaction.run({
                sql: `UPDATE ArrivalWindows SET capacity_reserved = capacity_reserved + 1 WHERE slot_id = @slotId`,
                params: { slotId }
            });

            await transaction.commit();
        });
        logAuditJson({
            severity: "INFO",
            action: "SLOT_RESERVATION_SUCCESS",
            slotId,
            gateId,
            uid,
        });
        return { status: "SUCCESS", message: "Slot reserved via Cloud Spanner." };
    } catch (e: any) {
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
export const calculateOptimalPath = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { originLat, originLng, destinationGate, stepFreeRequired } = (request.data ?? {}) as any;

    if (USE_MOCK_DATA) {
        functions.logger.info(`[MOCK] Routing to ${destinationGate}. Step-Free: ${stepFreeRequired}`);
        const seatTime = stepFreeRequired ? "18 mins" : "12 mins";

        return {
            routeId: "rt-" + Date.now(),
            pathNodes: [
                { lat: originLat, lng: originLng, description: "Current Location" },
                { lat: 34.0522, lng: -118.2437, description: stepFreeRequired ? "Elevator Bank C" : "Stairwell B" },
                { lat: 34.0530, lng: -118.2450, description: destinationGate }
            ],
            perimeterToSeatTime: seatTime,
            status: "OPTIMIZED_VIA_BIGQUERY"
        };
    }

    // TODO: Google Maps Routes API Node.js call
    return { status: "AWAITING_MAPS_BINDING" };
});

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

        const rawHeader = req.headers["x-vertex-ingest-key"];
        const headerKey = typeof rawHeader === "string" ? rawHeader : Array.isArray(rawHeader) ? rawHeader[0] : undefined;
        const body = req.body && typeof req.body === "object" ? (req.body as { ingestKey?: string }) : {};
        const bodyKey = typeof body.ingestKey === "string" ? body.ingestKey : undefined;
        const provided = headerKey ?? bodyKey;

        const expected = vertexIngestKey.value();
        const emulatorMode = process.env.FUNCTIONS_EMULATOR === "true";
        const prodAuthorized = safeEqualUtf8(provided, expected);
        const emulatorMockAuthorized =
            emulatorMode && safeEqualUtf8(provided, "MOCK_VERTEX_INGEST_KEY");
        const authorized = prodAuthorized || emulatorMockAuthorized;

        if (!authorized) {
            functions.logger.warn(
                `[AUDIT] vertexAggregator deployment=${deploymentMode} result=unauthorized`
            );
            res.status(401).send("Unauthorized");
            return;
        }

        if (emulatorMode && emulatorMockAuthorized) {
            functions.logger.warn(
                `[AUDIT] vertexAggregator deployment=EMULATOR_MODE auth=MOCK_VERTEX_INGEST_KEY note=not_for_production`
            );
        }

        const payload = req.body && typeof req.body === "object" ? req.body : {};

        if (USE_MOCK_DATA) {
            const heatmapAverage = (payload as { averageDensity?: number }).averageDensity || 85;
            functions.logger.info(`[MOCK] Ingested Vertex Vision frame. Congestion: ${heatmapAverage}%`);

            await admin.firestore().collection("gateLogistics").doc("GATE_B").set(
                {
                    currentPressure: heatmapAverage,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                },
                { merge: true }
            );

            res.status(200).send({ status: "Ingested", heatmapAverage });
            return;
        }

        res.status(200).send({ status: "Awaiting valid Vertex pipeline." });
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

        const body = (req.body && typeof req.body === "object" ? req.body : {}) as {
            type?: string;
            location?: string;
            key?: string;
        };
        const { type, location, key } = body;

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

        await admin.firestore().collection("globalEvents").doc("emergency").set({
            type: type || "EVACUATION",
            location: location || "ALL",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            active: true,
        });

        res.status(200).send({ message: "Emergency Override dispatched to Firestore edge layer." });
    }
);
