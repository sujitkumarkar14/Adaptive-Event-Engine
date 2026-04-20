#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> ESLint"
npm run lint

echo "==> Vitest (frontend)"
npm test

echo "==> Vite build"
npm run build

echo "==> Functions tests + build"
cd functions
npm test
npm run build
cd "$ROOT"

echo "==> Verify OK"
