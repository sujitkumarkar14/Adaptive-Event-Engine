import { describe, it, expect } from 'vitest';
import { evaluateSlotBookability, bookabilityLabel } from '../bookingSlotBookability';

describe('evaluateSlotBookability', () => {
  const winStart = new Date('2026-06-01T04:00:00.000Z');
  const winEnd = new Date('2026-06-01T14:00:00.000Z');
  const slotStart = new Date('2026-06-01T10:00:00.000Z');
  const slotEnd = new Date('2026-06-01T10:30:00.000Z');

  it('returns past when now is after slot end', () => {
    const now = new Date('2026-06-01T11:00:00.000Z');
    expect(
      evaluateSlotBookability({
        now,
        bookingWindowStart: winStart,
        bookingWindowEnd: winEnd,
        slotStart,
        slotEnd,
        capacityRemaining: 10,
      })
    ).toBe('past');
  });

  it('returns available inside window with capacity', () => {
    const now = new Date('2026-06-01T10:15:00.000Z');
    expect(
      evaluateSlotBookability({
        now,
        bookingWindowStart: winStart,
        bookingWindowEnd: winEnd,
        slotStart,
        slotEnd,
        capacityRemaining: 5,
      })
    ).toBe('available');
  });

  it('returns full when capacity is zero', () => {
    const now = new Date('2026-06-01T10:15:00.000Z');
    expect(
      evaluateSlotBookability({
        now,
        bookingWindowStart: winStart,
        bookingWindowEnd: winEnd,
        slotStart,
        slotEnd,
        capacityRemaining: 0,
      })
    ).toBe('full');
  });

  it('returns before_window when now is before booking opens', () => {
    const now = new Date('2026-06-01T03:00:00.000Z');
    expect(
      evaluateSlotBookability({
        now,
        bookingWindowStart: winStart,
        bookingWindowEnd: winEnd,
        slotStart,
        slotEnd,
        capacityRemaining: 10,
      })
    ).toBe('before_window');
  });

  it('returns after_window when booking closed but slot not yet ended', () => {
    const now = new Date('2026-06-01T15:00:00.000Z');
    const lateSlotStart = new Date('2026-06-01T17:00:00.000Z');
    const lateSlotEnd = new Date('2026-06-01T18:00:00.000Z');
    expect(
      evaluateSlotBookability({
        now,
        bookingWindowStart: winStart,
        bookingWindowEnd: winEnd,
        slotStart: lateSlotStart,
        slotEnd: lateSlotEnd,
        capacityRemaining: 10,
      })
    ).toBe('after_window');
  });

  it('labels states for UI', () => {
    expect(bookabilityLabel('available')).toMatch(/Available/i);
    expect(bookabilityLabel('past')).toMatch(/Elapsed/i);
    expect(bookabilityLabel('full')).toMatch(/capacity/i);
    expect(bookabilityLabel('before_window')).toMatch(/soon/i);
    expect(bookabilityLabel('after_window')).toMatch(/closed/i);
  });
});
