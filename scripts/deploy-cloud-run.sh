#!/usr/bin/env bash
# Build the nginx + Vite SPA image and deploy to Cloud Run (see cloudbuild.yaml).
# Prereqs: gcloud auth, billing, APIs (Artifact Registry, Cloud Build, Cloud Run).
# Optional: local `.env` with VITE_* so the Docker build embeds Firebase config (see .gcloudignore).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-}}}"
# Must match cloudbuild.yaml (image host + Cloud Run region)
REGION="${CLOUD_RUN_REGION:-asia-south1}"
AR_REPO="${ARTIFACT_REGISTRY_REPO:-adaptive-repo}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 PROJECT_ID"
  echo "Example: $0 adaptive-entry"
  exit 1
fi

if [[ ! -f "${ROOT}/.env" ]]; then
  echo "Warning: no .env in ${ROOT} — Vite build in Cloud may miss VITE_* (copy from .env.example and fill)."
fi

echo "=== APIs (safe to re-run) ==="
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com \
  --project "${PROJECT_ID}"

echo "=== Artifact Registry: ${AR_REPO} (${REGION}) ==="
if ! gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "Creating Docker repository ${AR_REPO} (one-time)…"
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --description="Adaptive Entry frontend images"
else
  echo "Repository ${AR_REPO} already exists."
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
