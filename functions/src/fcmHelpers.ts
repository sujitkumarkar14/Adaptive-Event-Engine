import * as admin from "firebase-admin";

/**
 * Emergency: high-priority data payload to `emergency` topic (clients must subscribe via `registerFcmTopics`).
 */
export async function sendEmergencyTopicMessage(payload: {
    type?: string;
    location?: string;
}): Promise<void> {
    await admin.messaging().send({
        topic: "emergency",
        data: {
            kind: "emergency",
            priority: "high",
            type: payload.type ?? "EVACUATION",
            location: payload.location ?? "ALL",
            ts: String(Date.now()),
        },
        android: { priority: "high" },
        apns: {
            headers: { "apns-priority": "10" },
            payload: { aps: { contentAvailable: true } },
        },
    });
}

/**
 * Smart reroute notice to all subscribers of `smart_reroute` topic.
 */
export async function sendSmartRerouteTopicMessage(payload: {
    message?: string;
    source: "staff" | "auto";
}): Promise<void> {
    const body =
        payload.message ??
        "Smart Reroute Active: Follow the new path to avoid congestion.";
    await admin.messaging().send({
        topic: "smart_reroute",
        notification: {
            title: "Smart reroute",
            body,
        },
        data: {
            kind: "smart_reroute",
            source: payload.source,
            message: body,
            ts: String(Date.now()),
        },
        android: { priority: "high" },
    });
}

const MULTICAST_CHUNK = 500;

/**
 * Targeted high-priority nudge to fans whose zone matches a congested gate (per-token FCM).
 */
export async function sendCongestionNudgesToTokens(
    tokens: string[],
    gateId: string,
    voucherCode: string = "SMART_MOVE_10"
): Promise<{ successCount: number; failureCount: number }> {
    if (tokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
    }
    const body = `Smart Reroute Active - Please follow the new path to avoid the crush at ${gateId}.`;
    let successCount = 0;
    let failureCount = 0;
    for (let i = 0; i < tokens.length; i += MULTICAST_CHUNK) {
        const chunk = tokens.slice(i, i + MULTICAST_CHUNK);
        const res = await admin.messaging().sendEachForMulticast({
            tokens: chunk,
            notification: {
                title: "Venue coordination",
                body,
            },
            data: {
                kind: "targeted_congestion",
                gateId,
                priority: "high",
                voucherCode,
                ts: String(Date.now()),
            },
            android: { priority: "high" },
            apns: {
                headers: { "apns-priority": "10" },
                payload: { aps: { sound: "default" } },
            },
        });
        successCount += res.successCount;
        failureCount += res.failureCount;
    }
    return { successCount, failureCount };
}
