"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastEmergency = exports.vertexAggregator = exports.calculateOptimalPath = exports.reserveEntrySlot = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const USE_MOCK_DATA = true;
/**
 * Analytical Path: Spanner Transactional Booking
 * Proxies the request to Cloud Spanner to ensure strong consistency prevents overbooking.
 */
exports.reserveEntrySlot = functions.https.onCall(async (data, context) => {
    // Structural integrity: user must be authenticated.
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Request had no identity credentials.");
    }
    const { slotId, gateId } = data;
    if (!slotId || !gateId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing slot or gate specifiers.");
    }
    if (USE_MOCK_DATA) {
        functions.logger.info(`[MOCK] Spanner locking slot ${slotId} at ${gateId}`);
        return {
            status: "SUCCESS",
            message: "Slot reserved via Cloud Spanner (Mock).",
            transactionId: "tx-spanner-" + Math.floor(Math.random() * 1000000)
        };
    }
    // TODO: Await actual Spanner Node.js API integration
    return { status: "PENDING", details: "Spanner database not physically bound yet." };
});
/**
 * Analytical Path: Traffic-Aware Routing (Maps API Wrapper)
 * Factors Perimeter-to-Seat time minimizing congestion, consuming identity constraints.
 */
exports.calculateOptimalPath = functions.https.onCall(async (data, context) => {
    const { originLat, originLng, destinationGate, stepFreeRequired } = data;
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
 * Receives pixel-density ML payloads and maps them to concourse polygons.
 */
exports.vertexAggregator = functions.https.onRequest(async (req, res) => {
    // Inbound from Vertex Vision streams (Cloud Pub/Sub push or direct HTTP)
    const payload = req.body;
    if (USE_MOCK_DATA) {
        const heatmapAverage = payload.averageDensity || 85;
        functions.logger.info(`[MOCK] Ingested Vertex Vision frame. Congestion: ${heatmapAverage}%`);
        // Sync to hot-path Firestore instantly
        await admin.firestore().collection('gateLogistics').doc('GATE_B').set({
            currentPressure: heatmapAverage,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        res.status(200).send({ status: "Ingested", heatmapAverage });
        return;
    }
    res.status(200).send({ status: "Awaiting valid Vertex pipeline." });
});
/**
 * Safety Mesh: Emergency Broadcast Trigger
 * Cloud Function to be triggered securely to dispatch PubSub/WebSockets payload.
 */
exports.broadcastEmergency = functions.https.onRequest(async (req, res) => {
    const { type, location, key } = req.body;
    if (key !== "MOCK_SECRET_KEY") {
        res.status(401).send("Unauthorized");
        return;
    }
    // Push explicitly to a Firestore collection that all clients are listening to
    await admin.firestore().collection('globalEvents').doc('currentStatus').set({
        type: type || "EVACUATION",
        location: location || "ALL",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        active: true
    });
    res.status(200).send({ message: "Emergency Override dispatched to Firestore edge layer." });
});
//# sourceMappingURL=index.js.map