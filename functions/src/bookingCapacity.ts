/**
 * Pure helpers mirroring Spanner slot checks in `reserveEntrySlot` (testable without DB).
 */
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
