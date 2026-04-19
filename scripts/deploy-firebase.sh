#!/usr/bin/env bash
# Client build + reminder for Firebase Hosting / Functions deploy.
# Prereqs: Firebase project, `firebase login`, `firebase init` (or existing `.firebaserc` / `firebase.json`).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm ci
npm run build
echo ""
echo "Client bundle is in ./dist"
echo "Before first deploy:"
echo "  - Copy .env.example to .env and set VITE_* Firebase web config for your project."
echo "  - Set Functions secret: firebase functions:secrets:set EMERGENCY_BROADCAST_KEY"
echo "Deploy with Firebase CLI (example): firebase deploy --only firestore:rules,hosting,functions"
echo "For Cloud Build / Cloud Run, see cloudbuild.yaml in the repo root."
