#!/usr/bin/env bash
# Build the nginx + Vite SPA image and deploy to Cloud Run (see cloudbuild.yaml).
# Prereqs: gcloud auth, billing, Artifact Registry repo `adaptive-repo` in the chosen region,
# and a local `.env` with VITE_* values so the Docker build can embed Firebase config (or use Cloud Build secrets).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-}}}"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 PROJECT_ID"
  echo "Example: $0 adaptive-entry"
  exit 1
fi

if [[ ! -f "${ROOT}/.env" ]]; then
  echo "Warning: no .env in ${ROOT} — Vite build in Cloud may miss VITE_* (copy from .env.example and fill)."
fi

COMMIT_REF="$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo manual)"

echo "=== Cloud Build → Artifact Registry → Cloud Run (${PROJECT_ID}, _COMMIT_SHA=${COMMIT_REF}) ==="
gcloud builds submit "${ROOT}" \
  --project "${PROJECT_ID}" \
  --config "${ROOT}/cloudbuild.yaml" \
  --substitutions="_COMMIT_SHA=${COMMIT_REF}"

echo ""
echo "=== Cloud Run URL ==="
gcloud run services describe adaptive-entry-frontend \
  --project "${PROJECT_ID}" \
  --region asia-south1 \
  --format='value(status.url)' 2>/dev/null || echo "(describe failed — check region matches cloudbuild.yaml: asia-south1)"
