# Judging guide — evidence map (Adaptive Entry 360)

**Adaptive Entry 360** is a React + Firebase venue operations demo: **Firestore** for live coordination, **Cloud Functions** (HTTPS + callable) for policy, booking, and ingest edges, optional **Cloud Spanner** for transactional slot booking, and **FCM** for reroutes and emergencies. This page maps **rubric-style expectations** to **where a reviewer can verify** them in the repo—code, docs, tests, and artifacts.

---

## Code quality

| Expectation | Evidence |
|-------------|----------|
| Typed application logic | TypeScript across `src/` and `functions/src/`; ESLint (`eslint.config.js`) via `npm run lint`. |
| Predictable state in complex flows | **`DECISIONS.md` ADR-005** — `useReducer` + explicit transitions in `src/store/entryStore.tsx` (intentional alternative to a heavier state-machine library; illegal transitions avoided by reducer design). |
| Architectural rationale | **`DECISIONS.md`** (ADRs), **`ARCHITECTURE.md`**, **`FUNCTIONS.md`**. |

---

## Security

| Expectation | Evidence |
|-------------|----------|
| Input validation on sensitive edges | **Zod** schemas in `functions/src/validation.ts`; HTTP/callable bodies validated before side effects. |
| Threat model & operational steps | **`SECURITY.md`**, **`SECURITY_RUNBOOK.md`** (App Check rollout, secret rotation, least privilege). |
| Abuse resistance (rate limits, auth) | `functions/src/httpRateLimit.ts`, Firestore rules (`firestore.rules`), routing policy auth (`functions/src/routingPolicyAuth.ts`). |

---

## Efficiency

| Expectation | Evidence |
|-------------|----------|
| Offline-friendly reads | Firestore persistence / cache patterns — see **`RESILIENCE.md`**, client bootstrap in `src/lib/firebase.ts`. |
| Load / concurrency evidence | Callable load snapshot: `npm run test:load` → **`artifacts/load-test-results.json`** (also produced in CI emulator job). Optional k6 shell: `tests/load/k6-venue-spike.js` + **`TESTING.md`**. |
| Performance narrative | **`PERFORMANCE.md`**, `npm run bench:*` scripts. |

---

## Testing

Review the strongest evidence first (ordered by signal):

1. **Functions emulator integration** — `npm run test:emulator` → `functions/src/__tests__/emulator.integration.test.ts` (Auth + callable + Firestore; `reserveEntrySlot` hits Spanner after validation; `updateRoutingPolicyLive` asserts Firestore writes).
2. **Authenticated E2E flows** — `npm run test:e2e` → `e2e/*-flow.spec.ts` (requires `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` for real sessions; preview build enables chaos/evac drill via `e2e:preview`).
3. **Load / concurrency artifact** — `npm run test:load` → `artifacts/load-test-results.json` (also regenerated in CI `functions-emulator` job).
4. **Accessibility dynamic updates** — `src/__tests__/a11y.*.spec.tsx`, `ACCESSIBILITY.md`.
5. **Shell / auth smoke** — `e2e/app.spec.ts`, `e2e/*-shell.spec.ts`, protected-route redirects.

| Layer | Command | Location |
|-------|---------|----------|
| Unit / component | `npm test`, `npm run test:coverage` | `src/**/*.test.tsx`, `src/**/*.spec.tsx` |
| E2E | `npm run test:e2e` (Playwright `webServer`: `npm run e2e:preview`) | `e2e/*.spec.ts` |
| Pre-flight (lint + unit + build) | `npm run validate` | CI runs lint, tests, coverage, build separately — see **`.github/workflows/ci.yml`** |
| Full local gate | `npm run verify` | `scripts/verify.sh` (lint, coverage, build, E2E, functions) |
| Functions | `cd functions && npm test` | `functions/src/**/*.test.ts`, `functions/src/__tests__/*.test.ts` |
| Functions coverage | `cd functions && npm run test:coverage` | Optional; excludes `functions/src/index.ts` from the report (see `functions/vitest.config.ts`) |
| Load (callable) | `npm run test:load` | `scripts/load-test.mjs` → `artifacts/load-test-results.json` |
| Load (k6, optional) | `npm run test:load:k6` | `tests/load/k6-venue-spike.js` (requires [k6](https://k6.io/) installed) |

Traceability table: **`VALIDATION_MATRIX.md`**. Doc index check: `npm run docs:generate`.

---

## Accessibility

| Expectation | Evidence |
|-------------|----------|
| Automated a11y regression | `vitest-axe` suites under `src/__tests__/a11y.*.spec.tsx`; see **`ACCESSIBILITY.md`**, **`docs/accessibility-audit.md`**. |
| Live region updates (crowd / coordination) | Components such as gate matrix / concierge use **`aria-live="polite"`** where density or tips update; brutalist controls meet **44×44px** touch targets in `src/components/common/StarkComponents.tsx`. |
| Lighthouse-style quality | Targets and manual checks documented in **`ACCESSIBILITY.md`** / audit doc (100/100 as a **goal**, verified with Lighthouse + axe in development). |

---

## Google services (why these choices)

| Service | Role in this repo | Pointer |
|---------|-------------------|---------|
| **Firebase (Auth, Firestore, FCM, Functions)** | Identity, live documents, push coordination, serverless edges | `src/lib/firebase.ts`, `functions/src/index.ts`, **`GOOGLE_SERVICES.md`** |
| **Cloud Spanner** (optional) | Transactional slot booking at scale vs document-only stores | **`DECISIONS.md` ADR-004**, `reserveEntrySlot` in `functions/src/index.ts` |
| **Maps Platform** (optional) | Routes / Places / distance context behind secrets | `functions/` + env secrets |
| **Vertex AI** (optional path) | Ingest / analytical paths behind feature flags | **`GOOGLE_SERVICES.md`**, Functions ingest |
| **Cloud Translation** | Alert / concierge translation | Callable `translateAlert` |

Stretch goals not fully wired in-repo (quantization, Advanced Markers 3D) stay in **`GOAL.md`** / ADRs—see **What we do not claim** below.

---

## Problem statement alignment

| Rubric keyword | What we ship | Where |
|----------------|--------------|-------|
| **Crowd movement** | Live gate pressure, reroute policy, FCM `smart_reroute`, map/ETA helpers | `Dashboard`, `gateMatrix`, `functions/src/index.ts` |
| **Waiting times** | Slot booking, congestion nudges, dashboard wait card | `reserveEntrySlot`, `e2e/waiting-time-*.spec.ts` |
| **Real-time coordination** | Firestore listeners, emergency doc, `broadcastEmergency`, staff routing callables | `firestore.rules`, E2E `e2e/real-time-coordination.spec.ts`, `e2e/emergency-coordination.spec.ts` |
| **Enjoyable / seamless** | Framed as **lower cognitive load** and **coordination without dead zones** — see **`PROBLEM_ALIGNMENT.md`** §4 and **`GOAL.md`**. |

Full narrative: **`PROBLEM_ALIGNMENT.md`**, feature map: **`GOAL.md`**.

---

## Verification artifacts

| Artifact | Typical location | Notes |
|----------|------------------|--------|
| Load test JSON | `artifacts/load-test-results.json` | Checked in; regenerated by `npm run test:load` and CI `functions-emulator` job |
| Coverage (local/CI) | `coverage/` | Gitignored; generated by `npm run test:coverage` |
| Playwright report | `playwright-report/`, `test-results/` | Gitignored; traces on retry per `playwright.config.ts` |
| Index | **`docs/artifacts/README.md`** | Explains where evidence lives |

---

## Quick commands for reviewers

```bash
npm run docs:generate   # verify core docs exist
npm run validate        # lint + unit tests + production build
npm run verify          # full gate including E2E + functions (local)
npm run deploy:all -- YOUR_GCP_PROJECT_ID   # Firestore rules + Functions + Hosting + Cloud Run (requires firebase + gcloud)
```

**Live demo (stadium / scanner):** Anonymous sign-in → **`/check-in`** → **`lookupDemoAttendee`**; demo booking **`reserveDemoSlot`**; seed **`npm run seed:demo -- <PROJECT_ID>`**. See **`README.md`**, **`DEMO_GUIDE.md`**, **`actuals.md`**.
