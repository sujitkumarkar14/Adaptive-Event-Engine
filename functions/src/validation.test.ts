import { describe, expect, it } from "vitest";
import {
    BroadcastEmergencyBodySchema,
    parseJsonBody,
    ReserveSlotSchema,
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
});
