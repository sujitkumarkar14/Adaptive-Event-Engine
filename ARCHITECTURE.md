# Architecture — Adaptive Entry 360

## Layout

| Area | Role |
|------|------|
| `src/` | React 19 SPA: pages, components, hooks, services, store (`entryStore`), Firebase bootstrap (`lib/firebase.ts`). |
| `src/pages/` | Route targets (lazy-loaded from `App.tsx`). |
| `src/components/` | Shared UI (e.g. `StarkComponents`, navigation, admin tools). |
| `src/services/` | Client helpers (routing, BLE stubs, **staff routing policy** callable wrapper). |
| `functions/src/` | Cloud Functions: HTTPS callables, HTTP ingress (`vertexAggregator`, `broadcastEmergency`), Firestore triggers, Spanner booking proxy, **demo callables** (`lookupDemoAttendee`, `reserveDemoSlot`), Zod validation, rate limiting. |
| `scripts/deploy-all.sh` | Single **full deploy**: rules → Functions → client build → Hosting → Cloud Run (`deploy-cloud-run.sh`). Root **`./deploy.sh`** is a wrapper. |
| `src/lib/demo*.ts` | Demo session keys, stadium constants, bookability helper shared with Functions parity. |
| `e2e/` | Playwright smoke and scenario tests against production build (`vite preview`). |

## Paths

- **Hot path:** Firestore reads/writes + persistent local cache + FCM topic subscriptions on the client.
- **Analytical path:** Cloud Functions + optional Spanner for slot reservation; HTTP endpoints for vision ingest and emergency broadcast (authenticated by secrets + rate limits).

## Related docs

- `README.md` — product mapping and diagrams  
- `FUNCTIONS.md` — function catalog  
- `SECURITY.md` — threat model and controls  
- `PERFORMANCE.md` — bundles and latency narrative  
