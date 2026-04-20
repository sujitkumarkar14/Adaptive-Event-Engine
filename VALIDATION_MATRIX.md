# Validation matrix — evidence map

Maps product and engineering expectations to **files, tests, and automation** in this repo. Use it for reviewers and release checklists.

| Area | Evidence | CI / command |
|------|----------|----------------|
| **Lint** | `eslint.config.js`, source | `npm run lint` |
| **Unit / component tests** | `src/**/*.test.tsx`, `src/**/*.spec.tsx` | `npm test`, `npm run test:coverage` |
| **Coverage floors** | `vitest.config.ts` thresholds | `npm run test:coverage` |
| **E2E (auth shells)** | `e2e/*.spec.ts` (Playwright) | `npm run build && npm run test:e2e` |
| **Cloud Functions** | `functions/src/**/*.test.ts`, `functions/src/__tests__/*.test.ts` | `cd functions && npm test` |
| **Validation / rate limits (Functions)** | `functions/src/validation.ts`, `functions/src/httpRateLimit.ts` + integration-style tests | `cd functions && npm test` |
| **Routing policy auth** | `functions/src/routingPolicyAuth.ts`, `functions/src/__tests__/routing-policy-permissions.test.ts` | `cd functions && npm test` |
| **Accessibility (automated)** | `vitest-axe` in `src/__tests__/a11y.*.spec.tsx`, `pages/__tests__/*a11y*` | `npm test` |
| **Performance artifact (local)** | `artifacts/perf-summary.json`, `scripts/write-perf-summary.mjs` | `npm run bench:perf` |
| **Concurrency snapshot (simulated)** | `artifacts/concurrency-summary.json`, `scripts/benchmark-concurrency.mjs` | `npm run bench:concurrency` |
| **Deep E2E shells** | `e2e/high-congestion-reroute.spec.ts`, `e2e/emergency-during-booking.spec.ts`, `e2e/offline-recovery-flow.spec.ts`, semantic `e2e/crowd-movement-reroute.spec.ts`, etc. | `npm run build && npm run test:e2e` |
| **Security docs** | `SECURITY.md`, `FUNCTIONS.md` | Manual review |
| **End-to-end verify** | `scripts/verify.sh` | `npm run verify` |

**Not machine-gated here:** production load tests, WCAG audit sign-off, live Firebase custom-claim flows (use staging + manual QA).
