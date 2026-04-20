# Architecture — Adaptive Entry 360

## Layout

| Area | Role |
|------|------|
| `src/` | React 19 SPA: pages, components, hooks, services, store (`entryStore`), Firebase bootstrap (`lib/firebase.ts`). |
| `src/pages/` | Route targets (lazy-loaded from `App.tsx`). |
| `src/components/` | Shared UI (e.g. `StarkComponents`, navigation, admin tools). |
| `src/services/` | Client helpers (routing, BLE stubs, **staff routing policy** callable wrapper). |
| `functions/src/` | Cloud Functions: HTTPS callables, HTTP ingress (`vertexAggregator`, `broadcastEmergency`), Firestore triggers, Spanner booking proxy, Zod validation, rate limiting. |
| `e2e/` | Playwright smoke and scenario tests against production build (`vite preview`). |

## Paths

- **Hot path:** Firestore reads/writes + persistent local cache + FCM topic subscriptions on the client.
- **Analytical path:** Cloud Functions + optional Spanner for slot reservation; HTTP endpoints for vision ingest and emergency broadcast (authenticated by secrets + rate limits).

## Related docs

- `README.md` — product mapping and diagrams  
- `FUNCTIONS.md` — function catalog  
- `SECURITY.md` — threat model and controls  
- `PERFORMANCE.md` — bundles and latency narrative  
