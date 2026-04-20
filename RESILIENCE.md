# Resilience — Adaptive Entry 360

How the system behaves under **partial failure**, **offline use**, and **load** — and where proof lives in this repo.

## Retry and backoff

- **Cloud Functions:** `functions/src/retry.ts` provides `withRetry` (exponential backoff, configurable retryability). Tests: `functions/src/__tests__/retry-logic.test.ts`.
- **HTTP rate limits:** `vertexAggregator` / `broadcastEmergency` return **Retry-After** when throttled (`functions/src/httpRateLimit.ts`).

## Booking capacity and races

- **Spanner:** `reserveEntrySlot` uses a **transaction** with read-then-update on `ArrivalWindows` to prevent overbooking when the real database is wired.
- **Pure logic tests:** `functions/src/bookingCapacity.ts` + `functions/src/__tests__/booking-capacity-logic.test.ts` mirror capacity checks for fast regression.

## Client offline and cache

- **Firestore:** `persistentLocalCache` + multi-tab manager — last subscribed reads can still display when the network drops (see **`ARCHITECTURE.md`**).
- **Demo mode:** When **`demoMode`** is on, gate pressure may be driven from **`demoEvents/{eventId}/aggregates/live`** (or script-simulated aggregates) instead of **`gateLogistics`** — still a single-listener pattern in `useAppOrchestration`, not thousands of per-attendee client subscriptions.
- **Network flag:** `entryStore` listens to `online` / `offline` and updates sync UI (`Navigation` footer). Tests: `src/__tests__/offline-network.integration.spec.tsx`; Playwright: `e2e/offline-then-reconnect-sync.spec.ts`, `e2e/offline-recovery-flow.spec.ts`.

## Routing policy and emergencies

- **Last writer:** Staff updates go through **`updateRoutingPolicyLive`**; clients subscribe to `routingPolicy/live`. Conflict handling is **server-serialized** via callables + rules, not arbitrary multi-writer clients.
- **Emergency:** Global emergency doc + `TRIGGER_EMERGENCY` path takes assertive UI priority (see **`useAppOrchestration`**, Dashboard).

## Failure handling (summary)

| Failure | Mitigation |
|---------|------------|
| Invalid HTTP body | Zod validation + 4xx |
| Rate abuse | Per-IP sliding window |
| Transient callable errors | `withRetry` pattern available; app-level UX for user-visible errors |
| Spanner / reservation failure | Callable maps to `HttpsError`; audit logs in `logAuditJson` |

## What is not simulated in CI

- Full **Firebase Emulator** matrix (Auth + Firestore + Functions) for every flow.
- **k6** / GCP load tests — run in your deployment pipeline if required.

See also **`README.md`** (Failure handling, System guarantees, System resilience) and **`PERFORMANCE.md`** (benchmark artifacts).
