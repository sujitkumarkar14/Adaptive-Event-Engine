# Contributing

## Prerequisites

- Node **22** (matches `functions` engines and CI).
- npm **ci** for reproducible installs.

## Workflow

1. `npm ci` in repo root; `cd functions && npm ci` for backend changes.
2. `npm run lint` — ESLint must pass.
3. `npm test` — Vitest.
4. `npm run build` — Vite production build.
5. For Functions: `cd functions && npm run build && npm test` (optional: `cd functions && npm run test:coverage`).
6. For E2E: `npm run build && npm run test:e2e` (install browsers once: `npm run test:e2e:install`).

Shortcut: `./scripts/verify.sh` or `npm run verify` (lint, **coverage thresholds**, production build, Playwright E2E, Functions test + build).

**Deploy everything (rules, Functions, Hosting, Cloud Run):** `npm run deploy:all -- <GCP_PROJECT_ID>` or `./deploy.sh <GCP_PROJECT_ID>` — see **`scripts/deploy-all.sh`**.

## Pull requests

- Keep changes focused; match existing naming and patterns.
- Do not commit `.env` or secrets.
- Update `README.md` or relevant `*.md` if behavior or contracts change.
