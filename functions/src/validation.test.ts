import { describe, expect, it } from "vitest";
import { BroadcastEmergencyBodySchema, parseJsonBody, VertexAggregatorBodySchema } from "./validation";

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
});
