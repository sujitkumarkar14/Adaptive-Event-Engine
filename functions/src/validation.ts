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

/** `calculateOptimalPath` callable — origin + routing options. */
export const CalculateOptimalPathBodySchema = z
    .object({
        originLat: z.union([z.number(), z.string()]).optional(),
        originLng: z.union([z.number(), z.string()]).optional(),
        destinationGate: z.string().max(64).optional(),
        stepFreeRequired: z.boolean().optional(),
        priority: z.union([z.literal("standard"), z.literal("vip"), z.literal("emergency"), z.string()]).optional(),
        returnToVehicle: z.boolean().optional(),
    })
    .passthrough();

/** `searchNearbyAmenities` callable. */
export const SearchNearbyAmenitiesBodySchema = z
    .object({
        latitude: z.union([z.number(), z.string()]).optional(),
        longitude: z.union([z.number(), z.string()]).optional(),
        wheelchairAccessibleOnly: z.boolean().optional(),
    })
    .passthrough();

/** `translateAlert` callable. */
export const TranslateAlertBodySchema = z
    .object({
        text: z.string().max(20_000).optional(),
        target: z.string().max(16).optional(),
        source: z.string().max(16).optional(),
    })
    .passthrough();

/** `registerFcmTopics` callable. */
export const RegisterFcmTopicsBodySchema = z
    .object({
        token: z.string().min(1).max(8192).optional(),
    })
    .passthrough();

export const LookupDemoAttendeeSchema = z.object({
    eventId: z.string().min(1).max(128),
    ticketNumber: z.string().min(1).max(96).regex(/^[A-Za-z0-9_-]+$/),
});

export const ReserveDemoSlotSchema = z.object({
    eventId: z.string().min(1).max(128),
    slotId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
    gateId: z.string().min(1).max(32).regex(/^[A-Z0-9_]+$/),
});

export function parseJsonBody<T>(raw: unknown, schema: z.ZodType<T>): { ok: true; data: T } | { ok: false; error: string } {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return { ok: false, error: parsed.error.message };
    }
    return { ok: true, data: parsed.data };
}
