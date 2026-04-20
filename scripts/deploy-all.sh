#!/usr/bin/env bash
# Full production deploy: Firestore rules → Cloud Functions → Vite build → Firebase Hosting → Cloud Run.
# Merges the former deploy-final + hosting/Cloud Run flows; Cloud Run uses deploy-cloud-run.sh (APIs, Artifact Registry, cloudbuild).
#
# Prereqs: firebase login, gcloud auth (application-default OK for builds), billing where required.
#
# Usage:
#   ./deploy.sh YOUR_PROJECT_ID
#   npm run deploy:all -- YOUR_PROJECT_ID
#   GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID npm run deploy:all
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-}}}"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "Missing project id."
  echo "  ./deploy.sh YOUR_GCP_PROJECT_ID"
  echo "  npm run deploy:all -- YOUR_GCP_PROJECT_ID"
  echo "  GOOGLE_CLOUD_PROJECT=YOUR_GCP_PROJECT_ID npm run deploy:all"
  exit 1
fi

export GOOGLE_CLOUD_PROJECT="${PROJECT_ID}"
# Must match VITE_FIREBASE_FUNCTIONS_REGION in client .env (default Firebase Functions region).
REGION_FUNCTIONS="${FIREBASE_FUNCTIONS_REGION:-us-central1}"

echo ""
echo "=== [1/6] GCP / Firebase secrets (configure before or between deploys; values are not committed) ==="
echo "  firebase functions:secrets:set MAPS_PLATFORM_KEY --project ${PROJECT_ID}"
echo "  firebase functions:secrets:set EMERGENCY_BROADCAST_KEY --project ${PROJECT_ID}"
echo "  firebase functions:secrets:set VERTEX_INGEST_KEY --project ${PROJECT_ID}"

echo ""
echo "=== [2/6] Firestore rules ==="
firebase deploy --only firestore:rules --project "${PROJECT_ID}"

echo ""
echo "=== [3/6] Cloud Functions (${REGION_FUNCTIONS}) ==="
npm --prefix "${ROOT}/functions" ci
npm --prefix "${ROOT}/functions" run build
firebase deploy --only functions --project "${PROJECT_ID}"

echo ""
echo "=== [4/6] Frontend bundle (npm ci + vite build → ./dist) ==="
npm ci
npm run build

echo ""
echo "=== [5/6] Firebase Hosting (${PROJECT_ID}) ==="
firebase deploy --only hosting --project "${PROJECT_ID}"

echo ""
echo "=== [6/6] Cloud Run (Artifact Registry + cloudbuild.yaml) ==="
bash "${ROOT}/scripts/deploy-cloud-run.sh" "${PROJECT_ID}"

echo ""
echo "Done. Audit trail: broadcastEmergency logs deployment=EMULATOR_MODE|PRODUCTION_MODE (emulator vs deployed runtime)."
echo ""
echo "Hosting: https://${PROJECT_ID}.web.app  https://${PROJECT_ID}.firebaseapp.com"
echo "Custom domains: Firebase Console → Hosting"
echo "Cloud Run: gcloud run services list --project=${PROJECT_ID}"
