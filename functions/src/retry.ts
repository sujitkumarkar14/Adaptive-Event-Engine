/**
 * Small async retry helper for transient failures (callable / HTTP clients).
 * Not used everywhere yet — available for consistent backoff behavior.
 */
export type RetryOptions = {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    isRetryable?: (error: unknown) => boolean;
};

const defaultRetryable = (e: unknown): boolean => {
    const msg = e instanceof Error ? e.message : String(e);
    return /ECONNRESET|ETIMEDOUT|timeout|503|429|unavailable/i.test(msg);
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const maxAttempts = Math.max(1, options.maxAttempts ?? 4);
    const baseDelayMs = options.baseDelayMs ?? 50;
    const maxDelayMs = options.maxDelayMs ?? 2000;
    const isRetryable = options.isRetryable ?? defaultRetryable;

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (attempt === maxAttempts || !isRetryable(e)) {
                throw e;
            }
            const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
            await new Promise((r) => setTimeout(r, exp));
        }
    }
    throw lastError;
}
