import { describe, expect, it, beforeEach } from "vitest";
import { checkHttpRateLimit, getClientIp, resetHttpRateLimitForTests } from "./httpRateLimit";
import type { HttpRateLimitRequest } from "./httpRateLimit";

describe("httpRateLimit", () => {
    beforeEach(() => {
        resetHttpRateLimitForTests();
    });

    it("allows requests under the cap", () => {
        expect(checkHttpRateLimit("k", 3, 10_000).ok).toBe(true);
        expect(checkHttpRateLimit("k", 3, 10_000).ok).toBe(true);
        expect(checkHttpRateLimit("k", 3, 10_000).ok).toBe(true);
    });

    it("blocks when the window is full", () => {
        expect(checkHttpRateLimit("k2", 2, 60_000).ok).toBe(true);
        expect(checkHttpRateLimit("k2", 2, 60_000).ok).toBe(true);
        const third = checkHttpRateLimit("k2", 2, 60_000);
        expect(third.ok).toBe(false);
        if (!third.ok) {
            expect(third.retryAfterSec).toBeGreaterThan(0);
        }
    });

    it("extracts first x-forwarded-for hop", () => {
        const req: HttpRateLimitRequest = {
            headers: { "x-forwarded-for": " 203.0.113.1 , 10.0.0.1" },
            socket: { remoteAddress: "127.0.0.1" },
        };
        expect(getClientIp(req)).toBe("203.0.113.1");
    });
});
