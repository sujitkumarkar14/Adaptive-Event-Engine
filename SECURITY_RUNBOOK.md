# Security runbook — Adaptive Entry 360

Operational steps for secrets, abuse reduction, and incident response. Pair with **`SECURITY.md`**.

## Secret rotation (HTTP ingest / broadcast)

1. Create a new secret value in **Google Cloud Secret Manager** (or `firebase functions:secrets:set` for Firebase-defined secrets).
2. Deploy Cloud Functions so new revisions bind the new secret: `firebase deploy --only functions` (or your CI pipeline).
3. Verify old traffic: send a request with the **previous** key to `vertexAggregator` / `broadcastEmergency` and confirm **401/403** after rotation.
4. Disable or delete the prior secret version in Secret Manager when traffic is clean.

## Callable and client secrets

- **Maps / Translation API keys** — rotate in Google Cloud Console (APIs & Services → Credentials); update Function env / secrets and redeploy.
- **Firebase Web `apiKey`** — public by design; tighten **HTTP referrer** restrictions and **App Check** instead of rotating frequently.

## App Check (optional → enforced)

1. Ensure production builds set **`VITE_DISABLE_APP_CHECK`** unset or `false` where App Check should run.
2. In Firebase Console → **App Check**, register the web app and enable **enforcement** for Firestore / Functions when ready.
3. Monitor **App Check metrics** for blocked clients before full enforcement.

## Rate limits and edge protection

- **Today:** per-IP sliding windows inside Cloud Functions (`httpRateLimit.ts`) — **per instance**, reset on cold start.
- **Production at scale:** add **Google Cloud Armor** (WAF) or **API Gateway** quotas in front of public HTTPS endpoints; document the Armor policy name and owner here when live.

## Incident checklist

1. **Credential leak suspected** — rotate affected secrets, review Cloud Audit Logs and Firebase Auth anomaly signals, revoke user sessions if needed.
2. **Abusive traffic** — enable or tighten Armor rules; lower rate-limit env vars temporarily; block IP ranges at the edge.
3. **Firestore rules regression** — run rules unit tests / emulator checks; roll back the last rules deploy if confirmed broken.

## Contacts

- Document your on-call rotation and GCP project IDs for staging vs production in your team wiki; this file stays generic.
