import { describe, it, expect } from 'vitest';
import { parseDemoSeatLevel } from '../seatSectionMap';

describe('parseDemoSeatLevel', () => {
  it('parses L1–L5 from demo ticket labels (requires hyphen after tier)', () => {
    expect(parseDemoSeatLevel('L1-101')).toBe(1);
    expect(parseDemoSeatLevel('l3-124')).toBe(3);
    expect(parseDemoSeatLevel('L5-140')).toBe(5);
  });

  it('trims whitespace', () => {
    expect(parseDemoSeatLevel('  L4-099  ')).toBe(4);
  });

  it('returns null for unknown shapes or tiers outside demo L1–L5', () => {
    expect(parseDemoSeatLevel(null)).toBeNull();
    expect(parseDemoSeatLevel('')).toBeNull();
    expect(parseDemoSeatLevel('Section A')).toBeNull();
    expect(parseDemoSeatLevel('L0-1')).toBeNull();
    expect(parseDemoSeatLevel('L6-1')).toBeNull();
    expect(parseDemoSeatLevel('L12-5')).toBeNull();
    expect(parseDemoSeatLevel('L3')).toBeNull();
    expect(parseDemoSeatLevel('VIP-1')).toBeNull();
  });
});
