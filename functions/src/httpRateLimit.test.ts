import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import {
    checkHttpRateLimit,
    enforceHttpRateLimit,
    getClientIp,
    resetHttpRateLimitForTests,
} from "./httpRateLimit";
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

    it("falls back to socket address or unknown", () => {
        expect(getClientIp({ headers: {}, socket: { remoteAddress: "::1" } })).toBe("::1");
        expect(getClientIp({ headers: {} })).toBe("unknown");
    });
});

describe("enforceHttpRateLimit", () => {
    beforeEach(() => {
        resetHttpRateLimitForTests();
        vi.restoreAllMocks();
        process.env.HTTP_RL_VERTEX_MAX = "2";
        process.env.HTTP_RL_VERTEX_WINDOW_MS = "60000";
        process.env.HTTP_RL_BROADCAST_MAX = "2";
        process.env.HTTP_RL_BROADCAST_WINDOW_MS = "60000";
    });

    afterEach(() => {
        delete process.env.HTTP_RL_VERTEX_MAX;
        delete process.env.HTTP_RL_VERTEX_WINDOW_MS;
        delete process.env.HTTP_RL_BROADCAST_MAX;
        delete process.env.HTTP_RL_BROADCAST_WINDOW_MS;
    });

    it("returns true and allows when under the HTTP cap", () => {
        const setHeader = vi.fn();
        const json = vi.fn();
        const status = vi.fn().mockReturnValue({ json });
        const req: HttpRateLimitRequest = { headers: {}, socket: { remoteAddress: "10.1.2.3" } };
        const ok = enforceHttpRateLimit(req, { setHeader, status } as never, "vertexAggregator");
        expect(ok).toBe(true);
        expect(status).not.toHaveBeenCalled();
    });

    it("returns false and sends 429 when over the cap", () => {
        const setHeader = vi.fn();
        const json = vi.fn();
        const status = vi.fn().mockReturnValue({ json });
        const res = { setHeader, status };
        const req: HttpRateLimitRequest = { headers: {}, socket: { remoteAddress: "10.9.9.9" } };
        expect(enforceHttpRateLimit(req, res as never, "broadcastEmergency")).toBe(true);
        expect(enforceHttpRateLimit(req, res as never, "broadcastEmergency")).toBe(true);
        const ok = enforceHttpRateLimit(req, res as never, "broadcastEmergency");
        expect(ok).toBe(false);
        expect(setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
        expect(status).toHaveBeenCalledWith(429);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ error: "rate_limited", retryAfterSec: expect.any(Number) })
        );
    });
});
