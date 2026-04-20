import { createHash } from "node:crypto";

/** Avoid duplicate `@types/express` clashes between firebase-functions and root. */
export type HttpRateLimitRequest = {
    headers: NodeJS.Dict<string | string[] | undefined>;
    socket?: { remoteAddress?: string };
};

export type HttpRateLimitResponse = {
    setHeader(name: string, value: string | number): void;
    status(code: number): { json(body: unknown): unknown };
};

type WindowEntry = { timestamps: number[] };

const windows = new Map<string, WindowEntry>();

/** Test hook: clear in-memory buckets. */
export function resetHttpRateLimitForTests(): void {
    windows.clear();
}

export function getClientIp(req: HttpRateLimitRequest): string {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
        return xff.split(",")[0]!.trim();
    }
    if (Array.isArray(xff) && xff[0]) {
        return String(xff[0]).trim();
    }
    const addr = req.socket?.remoteAddress;
    return typeof addr === "string" && addr.length > 0 ? addr : "unknown";
}

/**
 * Sliding-window rate limit per logical key (e.g. endpoint + hashed IP).
 * Best-effort per Cloud Functions instance; for global enforcement use Cloud Armor / API Gateway (see README).
 */
export function checkHttpRateLimit(
    key: string,
    maxPerWindow: number,
    windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
    const now = Date.now();
    const cutoff = now - windowMs;
    let entry = windows.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        windows.set(key, entry);
    }
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length >= maxPerWindow) {
        const oldest = Math.min(...entry.timestamps);
        const retryAfterMs = Math.max(0, windowMs - (now - oldest));
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }
    entry.timestamps.push(now);
    return { ok: true };
}

function hashIp(ip: string): string {
    return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export type HttpRateLimitEndpoint = "vertexAggregator" | "broadcastEmergency";

export function enforceHttpRateLimit(req: HttpRateLimitRequest, res: HttpRateLimitResponse, endpoint: HttpRateLimitEndpoint): boolean {
    const ip = getClientIp(req);
    const ipKey = hashIp(ip);

    const defaults =
        endpoint === "vertexAggregator"
            ? { max: 120, windowMs: 60_000 }
            : { max: 30, windowMs: 60_000 };

    const maxEnv =
        endpoint === "vertexAggregator" ? process.env.HTTP_RL_VERTEX_MAX : process.env.HTTP_RL_BROADCAST_MAX;
    const windowEnv =
        endpoint === "vertexAggregator"
            ? process.env.HTTP_RL_VERTEX_WINDOW_MS
            : process.env.HTTP_RL_BROADCAST_WINDOW_MS;

    const max = Math.max(1, Number(maxEnv ?? defaults.max));
    const windowMs = Math.max(1000, Number(windowEnv ?? defaults.windowMs));

    const key = `${endpoint}:${ipKey}`;
    const result = checkHttpRateLimit(key, max, windowMs);
    if (!result.ok) {
        res.setHeader("Retry-After", String(result.retryAfterSec));
        res.status(429).json({
            error: "rate_limited",
            message: "Too many requests from this client; try again later.",
            retryAfterSec: result.retryAfterSec,
        });
        return false;
    }
    return true;
}
