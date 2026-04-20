import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BOOKING_GATE_ID,
  PARKING_LOT_ORIGIN,
  ROUTING_POLICY_COLLECTION,
  ROUTING_POLICY_DOC_ID,
  VENUE_DEMO_ORIGIN,
} from '../constants';

describe('constants', () => {
  it('exports default booking gate id', () => {
    expect(DEFAULT_BOOKING_GATE_ID).toBe('GATE_B');
  });

  it('exports routing policy firestore ids for staff/attendee coordination', () => {
    expect(ROUTING_POLICY_COLLECTION).toBe('routingPolicy');
    expect(ROUTING_POLICY_DOC_ID).toBe('live');
  });

  it('exports demo venue origin for Routes + Places calls', () => {
    expect(VENUE_DEMO_ORIGIN.lat).toBeGreaterThan(33);
    expect(VENUE_DEMO_ORIGIN.lng).toBeLessThan(-118);
  });

  it('exports parking lot anchor aligned with server mapsPlatform (return-to-vehicle routing)', () => {
    expect(PARKING_LOT_ORIGIN.lat).toBeCloseTo(33.9529, 4);
    expect(PARKING_LOT_ORIGIN.lng).toBeCloseTo(-118.3401, 4);
  });
});
