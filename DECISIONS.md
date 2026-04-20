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
