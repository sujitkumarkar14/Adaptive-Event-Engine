#!/usr/bin/env bash
# Repo-root convenience wrapper for scripts/deploy-all.sh
exec "$(cd "$(dirname "$0")" && pwd)/scripts/deploy-all.sh" "$@"
