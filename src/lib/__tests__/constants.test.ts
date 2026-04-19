import { describe, it, expect } from 'vitest';
import { DEFAULT_BOOKING_GATE_ID } from '../constants';

describe('constants', () => {
  it('exports default booking gate id', () => {
    expect(DEFAULT_BOOKING_GATE_ID).toBe('GATE_B');
  });
});
