# FUNCTIONS.md | Adaptive Entry 360

This document catalogs the strictly typed, interoperable functions defining the "Surgical" business logic of the venue orchestration engine. All functions must be side-effect isolated and network-agnostic where possible.

**Regions:** Firebase callable and HTTP functions in this repo are deployed in **`us-central1`** (see `functions/src/index.ts`). The web app’s static hosting / Cloud Run front door may use a different region (for example **`asia-south1`** for Run); only the Functions region affects callable latency and Firestore trigger locality.

**HTTP abuse:** `vertexAggregator` and `broadcastEmergency` apply **sliding-window rate limits** per client IP (`functions/src/httpRateLimit.ts`). Tune with `HTTP_RL_VERTEX_*` and `HTTP_RL_BROADCAST_*` env vars. For global enforcement, use **Cloud Armor** or API quotas in front of the function URL.

## 1. State Management & Navigation (`src/store/entryStore.tsx`)

*   **`entryReducer(state, action)`:** The core deterministic state machine matrix handling phase transitions between `PRE_EVENT`, `IN_JOURNEY`, `ARRIVAL`, and `EMERGENCY`.
*   **`useEntryStore()`:** Context hook providing access to `state` and `dispatch`.

## 2. Infrastructure & Real-Time Sync (`src/firebase.ts`)

*   **`syncGatePressure(gateId, dispatch)`:** Listens for instantaneous edge pressure updates pushed by Vertex Aggregator via Cloud Run. Maps directly to `entryStore` data freshness hooks.
*   **`initRemoteConfig()`:** Bootstraps `gate_2_status` toggling for dynamic rerouting directly from Firebase.

## 3. Predicted Domain Functions (To Be Built)

### A. Routing & Transport
*   **`calculateOptimalPath(req)`:`(`functions/src/index.ts` & `src/services/routing.ts`)`**
    *   **Purpose:** Triggers the analytical engine simulating BigQuery and Google Route optimizations. Currently operates behind a `USE_MOCK_DATA` flag to prove UI rendering capabilities representing "Perimeter-to-Seat".
*   **`triggerOfflineReroute()`:** Addressed via the Edge integration within `src/services/bleProximity.ts` locally parsing nearest paths based on offline signals.

### B. Validation & Security
*   **`reserveEntrySlot(data)`:`(`functions/src/index.ts`)`**
    *   **Purpose:** Securely locks a timeslot utilizing Spanner High-concurrency proxies.
*   **`broadcastEmergency(data)`:`(`functions/src/index.ts`)`**
    *   **Purpose:** Writes `globalEvents/emergency` and sends a **high-priority data** FCM to topic `emergency` (clients register via `registerFcmTopics`).
*   **`getGateEtasMatrix` / `computeGateEtas` (`mapsPlatform.ts`):** Distance Matrix (walking) ranks gates in `gateLogistics` vs attendee origin — “Fastest to Reach”.
*   **`translateAlert`:** Cloud Translation API — English / Hindi / Telugu for alerts (`TRANSLATION_API_KEY`).
*   **`registerFcmTopics`:** Subscribes device token to FCM topics `emergency` + `smart_reroute` (server-side; pairs with `VITE_FCM_VAPID_KEY` + `/firebase-messaging-sw.js`).
*   **`onGatePressureChange`:** When any `gateLogistics/{gateId}` pressure crosses **> 85%**, merges `routingPolicy/live` auto reroute flags, then **segmented FCM**: queries `users` where `currentLocationZone` matches the congested gate and **`sendCongestionNudgesToTokens`** (per stored `fcmToken`). Audit: **`TARGETED_NUDGE`** / **`SEGMENTED_CONGESTION_*`**. Clients sync zone via `users/{uid}.currentLocationZone` from gate pressure (Dashboard).
*   **`getGateEtasMatrix`:** Accepts **`request.data.origin` { lat, lng }** (or `latitude`/`longitude` / `originLat`/`originLng`). Audit category **`MATRIX_RANKING`**.
*   **`translateAlert`:** Audit category **`A11Y_TRANSLATION`**.
*   **`onRoutingPolicyRerouteNotify`:** When `routingPolicy/live.gateRerouteActive` flips on, sends FCM to topic `smart_reroute` (staff or auto).
*   **`updateRoutingPolicyLive`:** Callable merge into `routingPolicy/live` (staff/admin claims in production; Firestore rules block direct client writes). Client: `src/services/staffRoutingPolicy.ts`.

### C. Sensors & Proximity
*   **`detectBeaconProximity(callback)`:`(`src/services/bleProximity.ts`)`**
    *   **Purpose:** Triggers strictly inside `IN_JOURNEY` to passively listen for station beacons (e.g., `0x181A` UUID), overriding GPS routing manually with high-urgency notifications.
