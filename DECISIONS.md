# Architecture decisions (lightweight)

## ADR-001 — Firestore cache API

**Context:** `enableIndexedDbPersistence` is deprecated.  
**Decision:** Use `initializeFirestore` with `persistentLocalCache` and `persistentMultipleTabManager`.  
**Consequence:** Tests use `getFirestore` in `MODE === 'test'` to avoid IndexedDB in jsdom.

## ADR-002 — Routing policy writes

**Context:** Clients must not write `routingPolicy/live` directly.  
**Decision:** Firestore rules deny client writes; **`updateRoutingPolicyLive`** callable merges allowed keys with role checks.  
**Consequence:** Staff UI uses `mergeRoutingPolicyLive` service wrapper.

## ADR-003 — Sensitive HTTP endpoints

**Context:** Ingest and emergency endpoints are secret-authenticated.  
**Decision:** Zod validation + constant-time secret compare + per-IP sliding-window rate limits; document Cloud Armor for production.  
**Consequence:** Limits are per-instance; global abuse prevention needs edge/WAF.

## ADR-004 — Spanner vs Firestore for slot booking

**Context:** The brief requires **strong consistency** for arrival slots so two attendees cannot reserve the last seat in a window through race conditions. Firestore excels at real-time sync and offline-friendly reads; it is not the default choice for **serializable cross-row inventory** at stadium scale.

**Decision:** **Cloud Spanner** backs `reserveEntrySlot` transactional paths (see `functions/src/index.ts` + Spanner SQL). **Firestore** remains the hot path for live gate pressure, routing policy reads, and user-scoped documents.

**Consequence:** Booking latency includes Spanner round-trip; clients must handle callable errors (`resource-exhausted`, `internal`) gracefully. Real-time “pressure” and “policy” UIs stay on Firestore listeners.

## ADR-005 — Entry phase state (reducer vs XState)

**Context:** Formal state machines (e.g. XState) reduce illegal transitions in emergency vs normal operation.

**Decision:** The app uses a **central `useReducer`** (`entryStore.tsx`) with typed actions and a single `phase` enum—predictable and testable without adding a second state runtime.

**Consequence:** If illegal transitions become a maintenance burden, a future refactor could extract the same transitions into XState **without** changing Firestore or Functions contracts.
