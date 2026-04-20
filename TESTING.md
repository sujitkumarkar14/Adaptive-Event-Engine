# Testing — Adaptive Entry 360

## Layers

| Layer | Command | Notes |
|-------|---------|--------|
| Unit / component | `npm test` | Vitest + Testing Library + jsdom |
| Coverage | `npm run test:coverage` | Thresholds in `vitest.config.ts` (lines/statements **65%**, functions **60%**, branches **55%**) |
| E2E | `npm run build && npm run test:e2e` | Playwright + Chromium; scenario shells in `e2e/*.spec.ts` |
| Functions | `cd functions && npm test` | Vitest (node), Zod + rate limit + auth helpers + `functions/src/__tests__` integration-style suites |
| Functions build | `cd functions && npm run build` | `tsc` |

## Product dimensions → tests

| Theme | What we prove |
|-------------|----------------|
| **Crowd movement** | Dashboard reroute + gate matrix tests (`Dashboard.*.test.tsx`), E2E shells for protected wayfinding routes |
| **Waiting times** | Booking flow tests (`Booking.test.tsx`), callable mocks for `reserveEntrySlot` |
| **Real-time coordination** | Staff dashboard + routing policy tests, `useAppOrchestration` / integration tests, Functions HTTP/callable validation |
| **Accessibility** | `vitest-axe` in `src/__tests__/a11y.*.spec.tsx` and staff dashboard a11y tests |
| **Security / abuse** | Functions: `routingPolicyAuth`, `httpRateLimit`, `validation`, integration tests under `functions/src/__tests__/` |

See **`VALIDATION_MATRIX.md`** for a compact requirements → evidence table.

## CI

`.github/workflows/ci.yml` runs lint, unit tests, coverage, production build, Playwright install + E2E, then Functions install/build/test.

## Verify all (local)

```bash
./scripts/verify.sh
```

Or: `npm run verify` (same steps: lint, coverage, build, E2E, functions).

## Coverage policy

Thresholds target **65 / 65 / 60 / 55** (lines / statements / functions / branches). If you add large UI surfaces without tests, add coverage **or** adjust thresholds with a short note in the PR — avoid silently disabling gates.
