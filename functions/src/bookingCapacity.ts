/**
 * Pure helpers mirroring Spanner slot checks in `reserveEntrySlot` (testable without DB).
 */
export type ArrivalWindowRow = { capacity_reserved?: unknown; max_capacity?: unknown };

export function isSlotAvailable(capacityReserved: number, maxCapacity: number): boolean {
    if (maxCapacity < 0 || capacityReserved < 0) return false;
    return capacityReserved < maxCapacity;
}

export function reservationOutcome(
    capacityReserved: number,
    maxCapacity: number
): "ok" | "capacity_exhausted" | "invalid" {
    if (maxCapacity < 0 || capacityReserved < 0) return "invalid";
    if (capacityReserved >= maxCapacity) return "capacity_exhausted";
    return "ok";
}

/**
 * Result of reading `ArrivalWindows` for a slot_id (mirrors `reserveEntrySlot` transaction read).
 */
export function evaluateArrivalWindowRow(
    rows: ArrivalWindowRow[]
): { ok: true } | { ok: false; reason: "no_slot" | "capacity_exhausted" } {
    if (!rows.length) {
        return { ok: false, reason: "no_slot" };
    }
    const first = rows[0];
    const cr = Number(first.capacity_reserved);
    const mc = Number(first.max_capacity);
    if (!Number.isFinite(cr) || !Number.isFinite(mc)) {
        return { ok: false, reason: "no_slot" };
    }
    if (cr >= mc) {
        return { ok: false, reason: "capacity_exhausted" };
    }
    return { ok: true };
}
