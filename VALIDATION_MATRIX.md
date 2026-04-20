# Validation matrix — evidence map

Maps product and engineering expectations to **files, tests, and automation** in this repo. Use it for reviewers and release checklists.

| Area | Evidence | CI / command |
|------|----------|----------------|
| **Lint** | `eslint.config.js`, source | `npm run lint` |
| **CI — Functions emulator** | `.github/workflows/ci.yml` job `functions-emulator` | `firebase emulators:exec` + integration + load artifact |
| **Unit / component tests** | `src/**/*.test.tsx`, `src/**/*.spec.tsx` | `npm test`, `npm run test:coverage` |
| **Coverage floors** | `vitest.config.ts` thresholds | `npm run test:coverage` |
| **E2E (auth shells)** | `e2e/*.spec.ts` (Playwright), incl. `e2e/long-run-simulation.spec.ts` | `npm run build && npm run test:e2e` |
| **Cloud Functions** | `functions/src/**/*.test.ts`, `functions/src/__tests__/*.test.ts` (incl. optional `emulator.integration.test.ts` with `RUN_EMULATOR_TESTS=1`) | `cd functions && npm test` |
| **Validation / rate limits (Functions)** | `functions/src/validation.ts`, `functions/src/httpRateLimit.ts` + integration-style tests | `cd functions && npm test` |
| **Fuzz / abuse simulation (Functions)** | `functions/src/__tests__/input-fuzzing.test.ts`, `rate-limit-fuzz.test.ts`, `abuse-simulation.test.ts` | `cd functions && npm test` |
| **Routing policy auth** | `functions/src/routingPolicyAuth.ts`, `functions/src/__tests__/routing-policy-permissions.test.ts` | `cd functions && npm test` |
| **Accessibility (automated + audit trail)** | `vitest-axe` in `src/__tests__/a11y.*.spec.tsx` (incl. `a11y.dynamic-stress.spec.tsx`, `a11y.screen-reader-flow.spec.tsx`), `pages/__tests__/*a11y*`; **`docs/accessibility-audit.md`** | `npm test` |
| **Performance artifact (local)** | `artifacts/perf-summary.json`, `scripts/write-perf-summary.mjs` | `npm run bench:perf` |
| **Concurrency snapshot (simulated)** | `artifacts/concurrency-summary.json`, `scripts/benchmark-concurrency.mjs` | `npm run bench:concurrency` |
| **Scale simulation (illustrative)** | `artifacts/scale-simulation.json`, `scripts/write-scale-simulation.mjs` | `npm run bench:scale` |
| **HTTP load snapshot (callable)** | `artifacts/load-test-results.json`, `scripts/load-test.mjs` | `npm run test:load` |
| **Resilience / retries** | `RESILIENCE.md`, `functions/src/retry.ts`, `functions/src/__tests__/retry-logic.test.ts` | `cd functions && npm test` |
| **Booking capacity logic** | `functions/src/bookingCapacity.ts`, `functions/src/__tests__/booking-capacity-logic.test.ts` | `cd functions && npm test` |
| **Deep E2E shells** | `e2e/multi-user-state-consistency.spec.ts`, `e2e/rapid-reroute-updates.spec.ts`, `e2e/concurrent-booking-conflict.spec.ts`, `e2e/backend-failure-recovery.spec.ts`, `e2e/offline-then-reconnect-sync.spec.ts`, plus semantic `e2e/crowd-movement-consistency.spec.ts`, etc. | `npm run build && npm run test:e2e` |
| **Security docs** | `SECURITY.md`, `FUNCTIONS.md` | Manual review |
| **End-to-end verify** | `scripts/verify.sh` | `npm run verify` |

**Not machine-gated here:** production load tests, WCAG audit sign-off, live Firebase custom-claim flows (use staging + manual QA).
