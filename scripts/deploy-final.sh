#!/usr/bin/env bash
# Phase 9 — Live cutover: secrets, Firestore rules, Cloud Functions, Firebase Hosting, Cloud Run.
# Prereqs: gcloud auth, firebase login, PROJECT_ID set (or pass as first arg).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-}}}"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: PROJECT_ID=my-proj $0   OR   $0 my-proj"
  exit 1
fi

export GOOGLE_CLOUD_PROJECT="${PROJECT_ID}"
# Must match `VITE_FIREBASE_FUNCTIONS_REGION` in client `.env` (default Firebase Functions region).
REGION_FUNCTIONS="${FIREBASE_FUNCTIONS_REGION:-us-central1}"

echo "=== [1/5] GCP / Firebase secrets ==="
echo "Configure before deploy (do not commit values):"
echo "  firebase functions:secrets:set MAPS_PLATFORM_KEY --project ${PROJECT_ID}"
echo "  firebase functions:secrets:set EMERGENCY_BROADCAST_KEY --project ${PROJECT_ID}"
echo "  firebase functions:secrets:set VERTEX_INGEST_KEY --project ${PROJECT_ID}"

echo "=== [2/5] Firestore rules ==="
firebase deploy --only firestore:rules --project "${PROJECT_ID}"

echo "=== [3/5] Cloud Functions (${REGION_FUNCTIONS}) ==="
npm --prefix "${ROOT}/functions" ci
npm --prefix "${ROOT}/functions" run build
firebase deploy --only functions --project "${PROJECT_ID}"

echo "=== [4/5] Frontend → Firebase Hosting ==="
npm ci
npm run build
firebase deploy --only hosting --project "${PROJECT_ID}"

echo "=== [5/5] Frontend container → Artifact Registry + Cloud Run (cloudbuild.yaml) ==="
COMMIT_REF="$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo manual)"
gcloud builds submit "${ROOT}" \
  --project "${PROJECT_ID}" \
  --config "${ROOT}/cloudbuild.yaml" \
  --substitutions="_COMMIT_SHA=${COMMIT_REF}"

echo ""
echo "Done. Audit trail: broadcastEmergency logs deployment=EMULATOR_MODE|PRODUCTION_MODE (emulator vs deployed runtime)."
echo ""
echo "Hosting URL (Firebase): https://${PROJECT_ID}.web.app  and  https://${PROJECT_ID}.firebaseapp.com"
echo "Find custom domains & latest deploy: Firebase Console → Hosting"
echo "Cloud Run (if step 5 succeeded): gcloud run services list --project=${PROJECT_ID}"
