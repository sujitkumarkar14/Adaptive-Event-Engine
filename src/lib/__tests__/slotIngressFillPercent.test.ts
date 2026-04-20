import { describe, it, expect } from 'vitest';
import { slotIngressFillPercent } from '../slotIngressFillPercent';

describe('slotIngressFillPercent', () => {
  it('matches booking card math (e.g. 400 total, 10 left → 98%)', () => {
    expect(slotIngressFillPercent(400, 10)).toBe(98);
  });

  it('returns 0 when nothing is filled', () => {
    expect(slotIngressFillPercent(1000, 1000)).toBe(0);
  });

  it('returns 100 when at capacity', () => {
    expect(slotIngressFillPercent(400, 0)).toBe(100);
  });

  it('returns 0 when total capacity is missing or invalid', () => {
    expect(slotIngressFillPercent(0, 10)).toBe(0);
    expect(slotIngressFillPercent(-1, 0)).toBe(0);
  });

  it('clamps fill rate at 100% if remaining dips below zero', () => {
    expect(slotIngressFillPercent(100, -5)).toBe(100);
  });

  it('treats remaining above total as no sales yet', () => {
    expect(slotIngressFillPercent(100, 150)).toBe(0);
  });

  it('rounds to nearest integer percentage', () => {
    expect(slotIngressFillPercent(3, 1)).toBe(67);
    expect(slotIngressFillPercent(3, 2)).toBe(33);
  });
});
