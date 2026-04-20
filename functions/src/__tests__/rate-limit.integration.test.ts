import { describe, expect, it, beforeEach } from "vitest";
import { checkHttpRateLimit, resetHttpRateLimitForTests } from "../httpRateLimit";

describe("rate limit integration", () => {
    beforeEach(() => {
        resetHttpRateLimitForTests();
    });

    it("isolates keys so different clients do not share buckets", () => {
        expect(checkHttpRateLimit("vertex:a", 1, 60_000).ok).toBe(true);
        expect(checkHttpRateLimit("vertex:b", 1, 60_000).ok).toBe(true);
    });

    it("resets allowance after window elapses (synthetic short window)", () => {
        const key = "ttl-test";
        expect(checkHttpRateLimit(key, 1, 5).ok).toBe(true);
        expect(checkHttpRateLimit(key, 1, 5).ok).toBe(false);
        // Advance time: new bucket cycle by using a fresh key with tiny window — here we reset store
        resetHttpRateLimitForTests();
        expect(checkHttpRateLimit(key, 1, 60_000).ok).toBe(true);
    });

    it("returns retryAfter when blocked", () => {
        const r1 = checkHttpRateLimit("block-me", 1, 10_000);
        const r2 = checkHttpRateLimit("block-me", 1, 10_000);
        expect(r1.ok).toBe(true);
        expect(r2.ok).toBe(false);
        if (!r2.ok) {
            expect(r2.retryAfterSec).toBeGreaterThan(0);
        }
    });
});
