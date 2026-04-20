export type SlotBookabilityState =
  | 'available'
  | 'past'
  | 'full'
  | 'before_window'
  | 'after_window';

export type SlotBookabilityInput = {
  now: Date;
  /** Inclusive start of when any booking is allowed for the event */
  bookingWindowStart: Date;
  /** Inclusive end of booking window (must book before this instant) */
  bookingWindowEnd: Date;
  slotStart: Date;
  slotEnd: Date;
  capacityRemaining: number;
};

/**
 * Canonical bookability for demo and production UIs.
 * - Past slot (event time passed): not bookable.
 * - Outside booking window: not bookable.
 * - No capacity: not bookable.
 */
export function evaluateSlotBookability(input: SlotBookabilityInput): SlotBookabilityState {
  const { now, bookingWindowStart, bookingWindowEnd, slotStart: _slotStart, slotEnd, capacityRemaining } =
    input;

  if (now.getTime() >= slotEnd.getTime()) {
    return 'past';
  }
  if (now.getTime() < bookingWindowStart.getTime()) {
    return 'before_window';
  }
  if (now.getTime() > bookingWindowEnd.getTime()) {
    return 'after_window';
  }
  if (capacityRemaining <= 0) {
    return 'full';
  }
  return 'available';
}

export function bookabilityLabel(state: SlotBookabilityState): string {
  switch (state) {
    case 'available':
      return 'Available';
    case 'past':
      return 'Elapsed';
    case 'full':
      return 'At capacity';
    case 'before_window':
      return 'Booking opens soon';
    case 'after_window':
      return 'Booking closed';
    default:
      return 'Unavailable';
  }
}
