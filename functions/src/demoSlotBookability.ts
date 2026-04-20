/** Mirrors `src/lib/bookingSlotBookability.ts` for server-side reserve validation. */

export type SlotBookabilityState =
    | "available"
    | "past"
    | "full"
    | "before_window"
    | "after_window";

export function evaluateSlotBookability(input: {
    now: Date;
    bookingWindowStart: Date;
    bookingWindowEnd: Date;
    slotStart: Date;
    slotEnd: Date;
    capacityRemaining: number;
}): SlotBookabilityState {
    const { now, bookingWindowStart, bookingWindowEnd, slotEnd, capacityRemaining } = input;

    if (now.getTime() >= slotEnd.getTime()) {
        return "past";
    }
    if (now.getTime() < bookingWindowStart.getTime()) {
        return "before_window";
    }
    if (now.getTime() > bookingWindowEnd.getTime()) {
        return "after_window";
    }
    if (capacityRemaining <= 0) {
        return "full";
    }
    return "available";
}
