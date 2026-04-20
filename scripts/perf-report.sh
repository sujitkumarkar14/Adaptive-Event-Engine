#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Running production build (sizes below are from Vite output)..."
npm run build 2>&1 | sed -n '/computing gzip size/,/✓ built/p'
