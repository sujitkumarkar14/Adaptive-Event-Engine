import { describe, it, expect } from 'vitest';
import { getRoutingOrigin } from '../routingOrigin';
import type { EntryState } from '../../store/entryStore';
import { NARENDRA_MODI_STADIUM } from '../demoConstants';
import { VENUE_DEMO_ORIGIN } from '../constants';

describe('getRoutingOrigin', () => {
  it('uses stadium demo coordinates when demoMode', () => {
    const base = { demoMode: true } as Pick<EntryState, 'demoMode'>;
    const o = getRoutingOrigin(base);
    expect(o.source).toBe('demo_stadium');
    expect(o.lat).toBe(NARENDRA_MODI_STADIUM.venueLat);
    expect(o.lng).toBe(NARENDRA_MODI_STADIUM.venueLng);
  });

  it('uses LA belt when not demo', () => {
    const base = { demoMode: false } as Pick<EntryState, 'demoMode'>;
    const o = getRoutingOrigin(base);
    expect(o.source).toBe('la_demo');
    expect(o.lat).toBe(VENUE_DEMO_ORIGIN.lat);
  });
});
