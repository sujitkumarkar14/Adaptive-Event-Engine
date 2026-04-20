import { describe, expect, it } from "vitest";
import { BroadcastEmergencyBodySchema, parseJsonBody, VertexAggregatorBodySchema } from "../validation";

describe("emergency & vertex payload validation (integration-style)", () => {
    it("rejects broadcast body with empty key", () => {
        const r = parseJsonBody({ key: "", type: "EVAC" }, BroadcastEmergencyBodySchema);
        expect(r.ok).toBe(false);
    });

    it("rejects broadcast body with missing key", () => {
        const r = parseJsonBody({ type: "EVAC" }, BroadcastEmergencyBodySchema);
        expect(r.ok).toBe(false);
    });

    it("accepts minimal valid broadcast body", () => {
        const r = parseJsonBody({ key: "x".repeat(200) }, BroadcastEmergencyBodySchema);
        expect(r.ok).toBe(true);
    });

    it("rejects vertex body when schema fails on wrong types for known fields", () => {
        const r = parseJsonBody(
            { ingestKey: "k", zoneId: "gate-a", averageDensity: "not-a-number" as unknown as number },
            VertexAggregatorBodySchema
        );
        expect(r.ok).toBe(false);
    });

    it("allows empty object for vertex (passthrough) for auth layer to reject", () => {
        const r = parseJsonBody({}, VertexAggregatorBodySchema);
        expect(r.ok).toBe(true);
    });
});
