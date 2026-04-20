import { describe, expect, it } from "vitest";
import {
    BroadcastEmergencyBodySchema,
    CalculateOptimalPathBodySchema,
    LookupDemoAttendeeSchema,
    parseJsonBody,
    RegisterFcmTopicsBodySchema,
    ReserveDemoSlotSchema,
    ReserveSlotSchema,
    SearchNearbyAmenitiesBodySchema,
    TranslateAlertBodySchema,
    VertexAggregatorBodySchema,
} from "./validation";

describe("parseJsonBody", () => {
    it("accepts vertex ingest body with passthrough fields", () => {
        const r = parseJsonBody(
            { ingestKey: "x", zoneId: "gate-a", extra: 1 },
            VertexAggregatorBodySchema
        );
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.zoneId).toBe("gate-a");
            expect((r.data as { extra?: number }).extra).toBe(1);
        }
    });

    it("rejects broadcast body without key", () => {
        const r = parseJsonBody({ type: "EVAC" }, BroadcastEmergencyBodySchema);
        expect(r.ok).toBe(false);
    });

    it("accepts broadcast body with key", () => {
        const r = parseJsonBody({ key: "secret", type: "EVAC", location: "ALL" }, BroadcastEmergencyBodySchema);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.key).toBe("secret");
        }
    });

    it("accepts reserve slot payloads from the web client", () => {
        const r = parseJsonBody({ slotId: "1", gateId: "GATE_B" }, ReserveSlotSchema);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.slotId).toBe("1");
            expect(r.data.gateId).toBe("GATE_B");
        }
    });

    it("rejects reserve slot with invalid gate id characters", () => {
        const r = parseJsonBody({ slotId: "1", gateId: "gate-lowercase" }, ReserveSlotSchema);
        expect(r.ok).toBe(false);
    });

    it("accepts calculateOptimalPath bodies with numeric or string coordinates", () => {
        const r = parseJsonBody(
            { originLat: "34.05", originLng: -118.24, destinationGate: "GATE_B", priority: "vip" },
            CalculateOptimalPathBodySchema
        );
        expect(r.ok).toBe(true);
    });

    it("accepts searchNearbyAmenities bodies", () => {
        const r = parseJsonBody({ latitude: 1, longitude: 2, wheelchairAccessibleOnly: true }, SearchNearbyAmenitiesBodySchema);
        expect(r.ok).toBe(true);
    });

    it("accepts translateAlert bodies", () => {
        const r = parseJsonBody({ text: "Hello", target: "hi", source: "en" }, TranslateAlertBodySchema);
        expect(r.ok).toBe(true);
    });

    it("accepts registerFcmTopics bodies", () => {
        const r = parseJsonBody({ token: "abc" }, RegisterFcmTopicsBodySchema);
        expect(r.ok).toBe(true);
    });

    it("accepts demo attendee lookup payloads", () => {
        const r = parseJsonBody({ eventId: "ev1", ticketNumber: "NMS-AE360-001" }, LookupDemoAttendeeSchema);
        expect(r.ok).toBe(true);
    });

    it("rejects demo lookup ticket with invalid characters", () => {
        const r = parseJsonBody({ eventId: "ev1", ticketNumber: "bad ticket" }, LookupDemoAttendeeSchema);
        expect(r.ok).toBe(false);
    });

    it("accepts demo slot reservation payloads", () => {
        const r = parseJsonBody({ eventId: "ev1", slotId: "slot-1", gateId: "GATE_NORTH" }, ReserveDemoSlotSchema);
        expect(r.ok).toBe(true);
    });

    it("rejects demo reserve with lowercase gate id", () => {
        const r = parseJsonBody({ eventId: "ev1", slotId: "a", gateId: "gate_north" }, ReserveDemoSlotSchema);
        expect(r.ok).toBe(false);
    });
});
