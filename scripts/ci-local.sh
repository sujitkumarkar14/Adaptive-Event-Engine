#!/usr/bin/env bash
# Local parity with .github/workflows/ci.yml (no Firebase deploy).
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
npm run lint
npm test
npm run test:coverage
npm run build
echo "ci-local: OK"
