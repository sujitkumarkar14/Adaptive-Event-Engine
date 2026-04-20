# Security — Adaptive Entry 360

## Threat model (summary)

| Asset | Risk | Mitigation in repo |
|-------|------|-------------------|
| Firestore data | Unauthorized read/write | Security rules; sensitive paths (e.g. `routingPolicy`) client **read-only**; writes via **callable** + role claims. |
| HTTP ingest / broadcast | Key theft, flooding | Shared secrets (`defineSecret`), **constant-time** compare, **Zod** bodies, **per-IP rate limits** (instance-local; add **Cloud Armor** in prod). |
| Web client | Scraping, abuse | **App Check** optional; API key **HTTP referrer** restrictions (document in GCP); least-privilege **IAM** for deploy. |
| Demo overrides | Confusion with real RBAC | `localStorage` demo role only in dev/test; **not** enforced server-side. |

## Auth & roles

- **Firebase Auth** with optional **custom claims** (`role`: `user` | `staff` | `admin` | `vip`).
- **`updateRoutingPolicyLive`:** production requires `staff` or `admin`; emulator allows any authenticated user for local demos (`isRoutingPolicyRoleAllowed` in `functions/src/routingPolicyAuth.ts`).

## Secrets

- Vertex ingest, emergency broadcast, maps, translation: **Secret Manager** / `defineSecret`; never commit real values.

## HTTP responses

- Invalid JSON bodies return `400` with **sanitized** error detail length (`sanitizeHttpErrorDetail`).

## Environments

- **Development:** local Vite, optional emulators, mock keys only in emulator paths.
- **Staging / production:** real project IDs, no mock keys, App Check and rules aligned with environment.

## Known limits

- Rate limiting is **per Cloud Functions instance**, not globally distributed without **Cloud Armor** / API Gateway.
