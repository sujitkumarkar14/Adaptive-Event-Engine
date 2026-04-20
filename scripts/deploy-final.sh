#!/usr/bin/env bash
# Deprecated name — same as scripts/deploy-all.sh (kept for existing scripts/docs).
exec "$(cd "$(dirname "$0")" && pwd)/deploy-all.sh" "$@"
