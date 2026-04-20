import { describe, it, expect, beforeEach } from "vitest";
import { BroadcastEmergencyBodySchema, parseJsonBody, VertexAggregatorBodySchema } from "../validation";
import { checkHttpRateLimit, resetHttpRateLimitForTests } from "../httpRateLimit";

describe("abuse simulation (validation + rate limit)", () => {
    beforeEach(() => {
        resetHttpRateLimitForTests();
    });

    it("floods malformed JSON-shaped payloads without throwing", () => {
        for (let i = 0; i < 300; i++) {
            const raw = {
                key: i % 7 === 0 ? "" : `k${i}`,
                type: i % 3 === 0 ? null : "EVAC",
                junk: new Array(i % 5).fill(i),
            };
            const r = parseJsonBody(raw, BroadcastEmergencyBodySchema);
            expect(r.ok === true || r.ok === false).toBe(true);
        }
    });

    it("vertex aggregator bodies accept or reject safely under mixed noise", () => {
        for (let i = 0; i < 120; i++) {
            const raw = {
                ingestKey: `ing-${i}`,
                zoneId: `zone-${i % 4}`,
                pressurePercent: i % 2 === 0 ? "bad" : i,
            };
            const r = parseJsonBody(raw, VertexAggregatorBodySchema);
            expect(r.ok === true || r.ok === false).toBe(true);
        }
    });

    it("single client IP key saturates rate limiter without throwing", () => {
        const key = "abuse:vertex:1";
        const max = 5;
        const windowMs = 10_000;
        let blocked = 0;
        for (let i = 0; i < 80; i++) {
            const r = checkHttpRateLimit(key, max, windowMs);
            if (!r.ok) blocked += 1;
        }
        expect(blocked).toBeGreaterThan(10);
    });

    it("repeated unauthorized-style validation failures do not mutate rate limit state unexpectedly", () => {
        const before = checkHttpRateLimit("separate:abuse", 100, 60_000);
        expect(before.ok).toBe(true);
        for (let i = 0; i < 50; i++) {
            parseJsonBody({ key: "" }, BroadcastEmergencyBodySchema);
        }
        const after = checkHttpRateLimit("separate:abuse", 100, 60_000);
        expect(after.ok).toBe(true);
    });
});
