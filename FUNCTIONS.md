# FUNCTIONS.md | Adaptive Entry 360

Server and client entry points for venue orchestration logic. Prefer small, testable modules (`functions/src/*.test.ts`, `functions/src/__tests__/*`); **`index.ts`** wires HTTP/callables/triggers and is primarily covered by integration/emulator tests.

**Regions:** Firebase callable and HTTP functions in this repo are deployed in **`us-central1`** (see `functions/src/index.ts`). The web app’s static **Firebase Hosting** bundle and **Cloud Run** front door may use another region (e.g. **`asia-south1`** for Run in `scripts/deploy-cloud-run.sh`); callable RTT depends on client ↔ Functions region.

**HTTP abuse:** `vertexAggregator` and `broadcastEmergency` apply **sliding-window rate limits** per client IP (`functions/src/httpRateLimit.ts`). Tune with **`HTTP_RL_VERTEX_*`** and **`HTTP_RL_BROADCAST_*`**. Tests: `functions/src/httpRateLimit.test.ts`. For global enforcement, use **Cloud Armor** or API quotas in front of the function URL.

---

## 1. State management (`src/store/entryStore.tsx`)

- **`entryReducer` / `useEntryStore`:** Phase machine (`PRE_EVENT` | `IN_JOURNEY` | `ARRIVAL` | `EMERGENCY`), booking status, gate pressure, accessibility, **demo context** (`demoMode`, `demoEventId` from `readDemoSession()` on init).
- **Actions:** `SET_DEMO_CONTEXT` / `CLEAR_DEMO_CONTEXT` — see `src/lib/demoSession.ts`.

---

## 2. Client Firebase & Firestore (`src/lib/`)

- **`firebase.ts`:** App init, **`initializeFirestore`** with **`persistentLocalCache`** + **`persistentMultipleTabManager`**, Auth, Functions, Remote Config, optional App Check.
- **`firestore.ts`:** **`syncGatePressure(gateId, dispatch)`** — subscribes to **`gateLogistics/{gateId}`** for live pressure used by the dashboard path.
- **Demo orchestration:** When **`demoMode`** and **`demoEventId`** are set, `useAppOrchestration` subscribes to **`demoEvents/{id}/aggregates/live`** for pressure instead of `gateLogistics` (see `src/hooks/useAppOrchestration.ts`).

---

## 3. Cloud Functions — catalog (high level)

### Validation

HTTPS callables validate **`request.data`** with **Zod** in `functions/src/validation.ts` (e.g. `ReserveSlotSchema`, **`LookupDemoAttendeeSchema`**, **`ReserveDemoSlotSchema`**, `CalculateOptimalPathBodySchema`, `SearchNearbyAmenitiesBodySchema`, `TranslateAlertBodySchema`, `RegisterFcmTopicsBodySchema`). **`parseJsonBody`** returns safe parse results.

### Booking & capacity

- **`reserveEntrySlot`:** Callable; transactional **Spanner** path on `ArrivalWindows` (`evaluateArrivalWindowRow` in `functions/src/bookingCapacity.ts`). Tests: `functions/src/__tests__/booking-capacity-logic.test.ts`.
- **`reserveDemoSlot`:** Callable; **Firestore** transaction on `demoEvents/{eventId}/slots` + user merge doc; validates with **`evaluateSlotBookability`** (`functions/src/demoSlotBookability.ts`). **Source:** `functions/src/demoCallables.ts`.

### Stadium / judge demo (no Spanner)

- **`lookupDemoAttendee`:** Callable; reads **`demoEvents/{eventId}/attendees/{ticketNumber}`** server-side only. **Source:** `functions/src/demoCallables.ts`. Re-exported from `functions/src/index.ts`.

### Maps & translation (`functions/src/mapsPlatform.ts`, `translation.ts`)

- **`calculateOptimalPath`**, **`getGateEtasMatrix`**, **`searchNearbyAmenities`**, **`translateAlert`:** Callables using Routes / Distance Matrix / Places / Translation as configured; **`USE_MOCK_DATA`** and emulator behavior documented in `index.ts`.
- **Pure helpers / tests:** `normalizeGateId`, `destinationForGate`, `allGateCoordinates`, **`computeGateEtas`** — see `functions/src/mapsPlatform.gates.test.ts`.

### FCM helpers (`functions/src/fcmHelpers.ts`)

- **`sendEmergencyTopicMessage`**, **`sendSmartRerouteTopicMessage`**, **`sendCongestionNudgesToTokens`** — Tests: `functions/src/fcmHelpers.test.ts`.

### Policy & HTTP

- **`updateRoutingPolicyLive`:** Callable merge into **`routingPolicy/live`**; role gate: `functions/src/routingPolicyAuth.ts`. Client wrapper: **`mergeRoutingPolicyLive`** in `src/services/staffRoutingPolicy.ts` (callable name **`updateRoutingPolicyLive`**).
- **`broadcastEmergency`**, **`vertexAggregator`:** HTTP JSON bodies validated with Zod; errors sanitized via **`sanitizeHttpErrorDetail`**.
- **`onGatePressureChange` / `onRoutingPolicyRerouteNotify`:** Firestore triggers as defined in `index.ts`.

### Shared utilities

- **`withRetry`** (`functions/src/retry.ts`): Tests `functions/src/__tests__/retry-logic.test.ts`.
- **Rate limit:** `enforceHttpRateLimit` — covered in `httpRateLimit.test.ts`.

---

## 4. Predictions vs stubs

Some product paragraphs in older briefs described **BigQuery / ML / closed-loop reroute** as future work. Today, **Vertex ingest** may run in mock/emulator mode; **staff reroute** is policy + FCM **`smart_reroute`** + dashboard UX — see **`CHECKLIST.md`** for paradigm status.

---

## 5. Client services (`src/services/`)

- **`routing.ts`**, **`bleProximity.ts`**, **`rewards.ts`**, staff **`staffRoutingPolicy.ts`** — call HTTPS callables / Firestore as implemented per file.
