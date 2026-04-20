import { describe, it, expect, beforeEach } from "vitest";
import { checkHttpRateLimit, resetHttpRateLimitForTests } from "../httpRateLimit";

function randomIp(): string {
    return `${randomByte()}.${randomByte()}.${randomByte()}.${randomByte()}`;
}

function randomByte(): number {
    return Math.floor(Math.random() * 256);
}

describe("rate limit fuzz", () => {
    beforeEach(() => {
        resetHttpRateLimitForTests();
    });

    it("arbitrary keys do not throw and return ok or bounded retry", () => {
        for (let i = 0; i < 200; i++) {
            const key = `fuzz:${randomIp()}:${Math.random().toString(36).slice(2)}`;
            const max = 3 + (i % 8);
            const windowMs = 5000 + (i % 2000);
            const r = checkHttpRateLimit(key, max, windowMs);
            if (r.ok) {
                expect(r).toEqual({ ok: true });
            } else {
                expect(r.retryAfterSec).toBeGreaterThan(0);
            }
        }
    });

    it("burst on single key eventually blocks", () => {
        const key = "burst-fuzz";
        const max = 5;
        const windowMs = 60_000;
        let blocked = 0;
        for (let i = 0; i < 40; i++) {
            const r = checkHttpRateLimit(key, max, windowMs);
            if (!r.ok) blocked += 1;
        }
        expect(blocked).toBeGreaterThan(0);
    });

    it("isolated keys do not share buckets", () => {
        expect(checkHttpRateLimit("a:1", 1, 60_000).ok).toBe(true);
        expect(checkHttpRateLimit("b:2", 1, 60_000).ok).toBe(true);
    });
});
