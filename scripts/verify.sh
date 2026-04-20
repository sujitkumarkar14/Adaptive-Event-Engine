#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> ESLint"
npm run lint

echo "==> Vitest (frontend) + coverage thresholds"
npm run test:coverage

echo "==> Vite build"
npm run build

echo "==> Playwright E2E (preview)"
npm run test:e2e

echo "==> Functions tests + build"
cd functions
npm test
npm run build
cd "$ROOT"

echo "==> Verify OK"
