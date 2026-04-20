/** Default gate id aligned with `gateLogistics` docs and Cloud Function booking payloads. */
export const DEFAULT_BOOKING_GATE_ID = 'GATE_B';

/** Live attendee routing / reroute broadcast (staff writes, all authed read). */
export const ROUTING_POLICY_COLLECTION = 'routingPolicy';
export const ROUTING_POLICY_DOC_ID = 'live';

/** Demo origin for Routes API + Places (venue belt). */
export const VENUE_DEMO_ORIGIN = { lat: 33.9538, lng: -118.3384 };

/** Must match `functions/src/mapsPlatform.PARKING_LOT_ORIGIN` (parking zone destination). */
export const PARKING_LOT_ORIGIN = { lat: 33.9529, lng: -118.3401 };
