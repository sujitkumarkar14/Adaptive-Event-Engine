# Testing — Adaptive Entry 360

## Layers

| Layer | Command | Notes |
|-------|---------|--------|
| Unit / component | `npm test` | Vitest + Testing Library + jsdom |
| Coverage | `npm run test:coverage` | Thresholds in `vitest.config.ts` (lines **80%**, statements **80%**, functions **70%**, branches **65%**); `src/lib/firebase.ts` + `src/contexts/AuthContext.tsx` excluded (bootstrap / provider glue) |
| E2E | `npm run build && npm run test:e2e` | Playwright: `chromium` (unauthenticated shells) + `chromium-authenticated` (`*.authenticated.spec.ts`, `*-flow.spec.ts`) with `e2e/auth.setup.ts` + `e2e/.auth/user.json`; set `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` for real sessions; preview uses `npm run e2e:preview` (chaos panel for evac drill E2E) |
| Functions | `cd functions && npm test` | Vitest (node), Zod + rate limit + auth helpers + `functions/src/__tests__` integration-style suites |
| Functions + emulators (optional) | `npm run test:emulator` | `firebase emulators:exec` (Auth + Functions + Firestore) + `RUN_EMULATOR_TESTS=1` — requires a JRE for the Firestore emulator (see `functions/src/__tests__/emulator.integration.test.ts`) |
| Callable load snapshot | `npm run test:load` | Writes `artifacts/load-test-results.json` (configure `LOAD_TEST_URL` / `LOAD_TEST_CONCURRENCY`) |
| k6 (optional, shell) | `BASE_URL=http://127.0.0.1:4173 k6 run tests/load/k6-venue-spike.js` | Parallel GETs to `/login` after `npm run preview`; install [k6](https://k6.io/docs/getting-started/installation/). Does not replace Firebase/Functions stress tests. |
| Functions build | `cd functions && npm run build` | `tsc` |

## Product dimensions → tests

| Theme | What we prove |
|-------------|----------------|
| **Crowd movement** | Dashboard reroute + gate matrix tests (`Dashboard.*.test.tsx`), E2E: `e2e/crowd-movement-reroute.spec.ts`, `e2e/high-congestion-reroute.spec.ts` |
| **Waiting times** | Booking flow tests (`Booking.test.tsx`, `Booking.emergency.spec.tsx`), E2E: `e2e/waiting-time-booking.spec.ts` |
| **Real-time coordination** | Staff dashboard + routing policy tests, `useAppOrchestration` / integration tests, E2E: `e2e/real-time-coordination.spec.ts`, `e2e/emergency-coordination.spec.ts` (auth shells), Functions HTTP/callable validation |
| **Accessibility** | `vitest-axe`; `a11y.focus-management`, `a11y.keyboard-full-flow`, `a11y.full-keyboard-journey`, `a11y.dynamic-content-announcement`, `a11y.dynamic-stress`, `a11y.screen-reader-flow`, `a11y.focus-recovery`; audit notes **`docs/accessibility-audit.md`** |
| **Offline / sync** | `src/__tests__/offline-network.integration.spec.tsx`, E2E: `e2e/offline-recovery-flow.spec.ts`, `e2e/offline-then-reconnect-sync.spec.ts` |
| **Concurrency / consistency (shell)** | `e2e/multi-user-state-consistency.spec.ts`, `e2e/rapid-reroute-updates.spec.ts`, `e2e/concurrent-booking-conflict.spec.ts`, semantic `e2e/crowd-movement-consistency.spec.ts`, `e2e/waiting-time-capacity-enforcement.spec.ts`, `e2e/real-time-coordination-under-load.spec.ts` |
| **Resilience (simulated)** | `e2e/backend-failure-recovery.spec.ts`; Functions: `retry-logic`, `booking-capacity-logic` |
| **Security / abuse** | Functions: `routingPolicyAuth`, `httpRateLimit`, `validation`, integration tests under `functions/src/__tests__/` |

See **`VALIDATION_MATRIX.md`** for a compact requirements → evidence table.

## CI

`.github/workflows/ci.yml` runs lint, unit tests, coverage, production build, Playwright install + E2E, Functions install/build/test, and a **`functions-emulator`** job (Java 21 + `firebase emulators:exec` with Auth + Functions + Firestore + `RUN_EMULATOR_TESTS=1` + `npm run test:load`) with **`load-test-results.json`** uploaded as an artifact.

## Verify all (local)

```bash
./scripts/verify.sh
```

Or: `npm run verify` (same steps: lint, coverage, build, E2E, functions).

**Faster pre-flight** (no coverage, no E2E, no functions): `npm run validate` (lint + unit tests + production build).

**Documentation gate:** `npm run docs:generate` ensures `JUDGING_GUIDE.md`, `GOAL.md`, `docs/artifacts/README.md`, and related index files exist (used in CI).

## Coverage policy

Thresholds target **80 / 80 / 70 / 65** (lines / statements / functions / branches) on included files. Firebase client init and `AuthProvider` are excluded from the denominator so the gate measures application logic, not SDK wiring. If you add large UI surfaces without tests, add coverage **or** adjust thresholds with a short note in the PR — avoid silently disabling gates.
