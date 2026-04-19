import { describe, it, expect, vi } from 'vitest';
import { meterDepartureFlow } from '../egress';

describe('meterDepartureFlow', () => {
  it('returns deterministic delay and status for any section id', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const out = meterDepartureFlow('SEC-104');
    expect(out.recommendedDelayMins).toBe(15);
    expect(out.statusText).toContain('CORRIDOR');
    log.mockRestore();
  });
});
