/** Firestore `demoEvents/{id}` — one canonical stadium event slice for judge demos. */
export const DEFAULT_DEMO_EVENT_ID = 'narendra-modi-stadium-demo';

/**
 * Narendra Modi Stadium (Motera, Ahmedabad) — public map centroid for demo anchors.
 * Synthetic attendee positions use small deterministic offsets via seeded PRNG in the seed script.
 */
export const NARENDRA_MODI_STADIUM = {
  venueName: 'Narendra Modi Stadium',
  venueLat: 23.0913,
  venueLng: 72.5977,
} as const;

export const DEMO_SESSION_FLAG_KEY = 'ae360_demo_mode';
export const DEMO_EVENT_ID_KEY = 'ae360_demo_event_id';
