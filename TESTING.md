# Testing — Adaptive Entry 360

## Layers

| Layer | Command | Notes |
|-------|---------|--------|
| Unit / component | `npm test` | Vitest + Testing Library + jsdom |
| Coverage | `npm run test:coverage` | Thresholds in `vitest.config.ts` |
| E2E | `npm run build && npm run test:e2e` | Playwright + Chromium |
| Functions | `cd functions && npm test` | Vitest (node), Zod + rate limit + auth helpers |
| Functions build | `cd functions && npm run build` | `tsc` |

## CI

`.github/workflows/ci.yml` runs lint, unit tests with coverage, production build, Playwright install + E2E, then Functions install/build/test.

## Verify all (local)

```bash
./scripts/verify.sh
```

Or: `npm run verify` (same steps).

## Coverage policy

Thresholds are set near measured coverage (~55%+ lines). If you add large UI surfaces without tests, lower thresholds in `vitest.config.ts` **or** add tests — avoid silently disabling gates.
