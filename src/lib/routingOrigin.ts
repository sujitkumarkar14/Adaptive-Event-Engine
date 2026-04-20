import type { EntryState } from '../store/entryStore';
import { VENUE_DEMO_ORIGIN } from './constants';
import { NARENDRA_MODI_STADIUM } from './demoConstants';

export type RoutingOrigin = { lat: number; lng: number; source: 'demo_stadium' | 'la_demo' };

/**
 * Browser journey map origin: stadium demo uses Motera coordinates; otherwise existing LA demo belt.
 */
export function getRoutingOrigin(state: Pick<EntryState, 'demoMode'>): RoutingOrigin {
  if (state.demoMode) {
    return { lat: NARENDRA_MODI_STADIUM.venueLat, lng: NARENDRA_MODI_STADIUM.venueLng, source: 'demo_stadium' };
  }
  return { lat: VENUE_DEMO_ORIGIN.lat, lng: VENUE_DEMO_ORIGIN.lng, source: 'la_demo' };
}
