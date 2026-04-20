import { describe, expect, it, vi } from "vitest";
import { withRetry } from "../retry";

describe("withRetry", () => {
    it("returns on first success", async () => {
        const fn = vi.fn().mockResolvedValue(42);
        await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).resolves.toBe(42);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on retryable error then succeeds", async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error("503 unavailable"))
            .mockResolvedValue("ok");
        await expect(
            withRetry(fn, { maxAttempts: 4, baseDelayMs: 5, maxDelayMs: 40 })
        ).resolves.toBe("ok");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("throws after max attempts on persistent retryable failure", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("503 unavailable"));
        await expect(
            withRetry(fn, { maxAttempts: 2, baseDelayMs: 5, maxDelayMs: 20 })
        ).rejects.toThrow("503");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("does not retry when isRetryable returns false", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("bad"));
        await expect(
            withRetry(fn, {
                maxAttempts: 3,
                baseDelayMs: 1,
                isRetryable: () => false,
            })
        ).rejects.toThrow("bad");
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
