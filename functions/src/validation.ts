import { z } from "zod";

/** POST body for `broadcastEmergency` (after JSON parse). */
export const BroadcastEmergencyBodySchema = z.object({
    key: z.string().min(1),
    type: z.string().optional(),
    location: z.string().optional(),
});

/** POST body for `vertexAggregator` (flexible ingest + mock fields). */
export const VertexAggregatorBodySchema = z
    .object({
        ingestKey: z.string().optional(),
        zoneId: z.string().optional(),
        averageDensity: z.number().optional(),
        count: z.number().optional(),
        pressurePercent: z.number().optional(),
    })
    .passthrough();

/** `reserveEntrySlot` callable — aligns with client booking payloads (`Booking.tsx`). */
export const ReserveSlotSchema = z.object({
    slotId: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/),
    gateId: z
        .string()
        .min(1)
        .max(32)
        .regex(/^[A-Z0-9_]+$/),
});

export function parseJsonBody<T>(raw: unknown, schema: z.ZodType<T>): { ok: true; data: T } | { ok: false; error: string } {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return { ok: false, error: parsed.error.message };
    }
    return { ok: true, data: parsed.data };
}
