import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { parseJsonBody, LookupDemoAttendeeSchema, ReserveDemoSlotSchema } from "./validation";
import { evaluateSlotBookability } from "./demoSlotBookability";

function attendeesColl(eventId: string) {
    return admin.firestore().collection("demoEvents").doc(eventId).collection("attendees");
}

function slotsColl(eventId: string) {
    return admin.firestore().collection("demoEvents").doc(eventId).collection("slots");
}

/**
 * Staff / judge lookup — returns attendee summary without exposing collection reads client-side.
 */
export const lookupDemoAttendee = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
    }
    const parsed = parseJsonBody(request.data, LookupDemoAttendeeSchema);
    if (!parsed.ok) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid lookup.");
    }
    const { eventId, ticketNumber } = parsed.data;
    const snap = await attendeesColl(eventId).doc(ticketNumber).get();
    if (!snap.exists) {
        functions.logger.info(
            JSON.stringify({
                severity: "INFO",
                action: "DEMO_ATTENDEE_LOOKUP",
                result: "not_found",
                eventId,
                timestamp: new Date().toISOString(),
            })
        );
        return { found: false as const };
    }
    const d = snap.data() as Record<string, unknown>;
    return {
        found: true as const,
        attendee: {
            name: typeof d.name === "string" ? d.name : "",
            ticketNumber: typeof d.ticketNumber === "string" ? d.ticketNumber : ticketNumber,
            seatSection: typeof d.seatSection === "string" ? d.seatSection : "",
            assignedGate: typeof d.assignedGate === "string" ? d.assignedGate : "",
            arrivalSlot: typeof d.arrivalSlot === "string" ? d.arrivalSlot : "",
            status: typeof d.status === "string" ? d.status : "",
            stepFree: d.stepFree === true,
            lowSensory: d.lowSensory === true,
            visualAid: d.visualAid === true,
        },
    };
});

/**
 * Firestore-backed demo reservation (does not use Spanner).
 */
export const reserveDemoSlot = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
    }
    const parsed = parseJsonBody(request.data, ReserveDemoSlotSchema);
    if (!parsed.ok) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid reservation request.");
    }
    const uid = request.auth.uid;
    const { eventId, slotId, gateId } = parsed.data;

    const eventRef = admin.firestore().collection("demoEvents").doc(eventId);
    const slotRef = slotsColl(eventId).doc(slotId);

    await admin.firestore().runTransaction(async (tx) => {
        const [eventSnap, slotSnap] = await Promise.all([tx.get(eventRef), tx.get(slotRef)]);
        if (!eventSnap.exists || !slotSnap.exists) {
            throw new functions.https.HttpsError("failed-precondition", "That slot is not available for booking.");
        }
        const e = eventSnap.data() as Record<string, unknown>;
        const bookingWindowStart = (e.bookingWindowStart as admin.firestore.Timestamp)?.toDate();
        const bookingWindowEnd = (e.bookingWindowEnd as admin.firestore.Timestamp)?.toDate();
        const slotStart = (slotSnap.data()?.startTime as admin.firestore.Timestamp | undefined)?.toDate();
        const slotEnd = (slotSnap.data()?.endTime as admin.firestore.Timestamp | undefined)?.toDate();
        const capacityRemaining = Number(slotSnap.data()?.capacityRemaining ?? 0);
        if (!bookingWindowStart || !bookingWindowEnd || !slotStart || !slotEnd) {
            throw new functions.https.HttpsError("failed-precondition", "Event schedule is not ready.");
        }
        const now = new Date();
        const book = evaluateSlotBookability({
            now,
            bookingWindowStart,
            bookingWindowEnd,
            slotStart,
            slotEnd,
            capacityRemaining,
        });
        if (book !== "available") {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "That time window is not available for booking."
            );
        }
        const assignedGate = typeof slotSnap.data()?.defaultGate === "string" ? (slotSnap.data()?.defaultGate as string) : gateId;
        tx.update(slotRef, {
            capacityRemaining: capacityRemaining - 1,
        });
        tx.set(
            admin.firestore().collection("users").doc(uid),
            {
                demoReservation: {
                    eventId,
                    slotId,
                    gateId: assignedGate,
                    reservedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
            },
            { merge: true }
        );
    });

    const txId = `demo-${eventId}-${slotId}-${Date.now().toString(36)}`;
    functions.logger.info(
        JSON.stringify({
            severity: "INFO",
            action: "DEMO_SLOT_RESERVED",
            eventId,
            slotId,
            uid,
            timestamp: new Date().toISOString(),
        })
    );

    return { status: "SUCCESS", transactionId: txId, mode: "demo" as const };
});
