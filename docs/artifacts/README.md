# Verification artifacts (where evidence lives)

This folder documents **where test and CI outputs appear** so reviewers do not have to guess. Generated files are usually **gitignored**; this README is the stable pointer.

| Evidence type | Location | How to produce |
|---------------|----------|----------------|
| **Vitest coverage** (HTML + lcov) | `coverage/` (repo root) | `npm run test:coverage` |
| **Functions Vitest coverage** | `functions/coverage/` (if generated) | `cd functions && npm run test:coverage` |
| **Playwright HTML report** | `playwright-report/` | `npx playwright show-report` after a run |
| **Playwright traces / results** | `test-results/` | Default Playwright output; traces **on-first-retry** in `playwright.config.ts` |
| **Callable load snapshot** | `artifacts/load-test-results.json` | `npm run test:load` (see `scripts/load-test.mjs`); CI emulator job uploads this path |
| **k6 SPA spike (optional)** | — | `npm run test:load:k6` (requires [k6](https://k6.io/) on `PATH`) |

**CI:** `.github/workflows/ci.yml` runs lint, unit tests, coverage, build, Playwright E2E, and Functions tests. The **`functions-emulator`** job runs integration tests and **`npm run test:load`**, then uploads **`artifacts/load-test-results.json`** as the **`load-test-results`** artifact.

For rubric-style mapping of features → files → commands, see **`JUDGING_GUIDE.md`**.
