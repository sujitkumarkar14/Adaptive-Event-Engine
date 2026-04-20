# Security — Adaptive Entry 360

Operational rotation, App Check rollout, and incident steps: **`SECURITY_RUNBOOK.md`**.

## Threat model (summary)

| Asset | Risk | Mitigation in repo |
|-------|------|-------------------|
| Firestore data | Unauthorized read/write | Security rules; sensitive paths (e.g. `routingPolicy`) client **read-only**; writes via **callable** + role claims. |
| HTTP ingest / broadcast | Key theft, flooding | Shared secrets (`defineSecret`), **constant-time** compare, **Zod** bodies, **per-IP rate limits** (instance-local; add **Cloud Armor** in prod). |
| Web client | Scraping, abuse | **App Check** optional; API key **HTTP referrer** restrictions (document in GCP); least-privilege **IAM** for deploy. |
| Demo overrides | Confusion with real RBAC | Demo role is read from `localStorage` only when **`import.meta.env.DEV`** or **`VITE_ENABLE_CHAOS_CONTROLLER`** is set (see `AuthContext`); **not** a server-side security boundary. |

## Auth & roles

- **Firebase Auth** with optional **custom claims** (`role`: `user` | `staff` | `admin` | `vip`).
- **`updateRoutingPolicyLive`:** production requires `staff` or `admin`; emulator allows any authenticated user for local demos (`isRoutingPolicyRoleAllowed` in `functions/src/routingPolicyAuth.ts`).

## Secrets

- Vertex ingest, emergency broadcast, maps, translation: **Secret Manager** / `defineSecret`; never commit real values.
- **`.env.example`** in the repo is an **empty template** only (no real keys). Copy to **`.env`** locally; **`.env`** stays gitignored. If you ever committed a real `.env`, rotate all exposed keys and use `git filter-repo` or support tooling to purge history; optional scan: [TruffleHog](https://github.com/trufflesecurity/trufflehog) or similar.

## Least privilege (deploy)

- Prefer a **dedicated service account** for Cloud Functions / CI deploy with only the roles needed (Firestore, Secret Accessor, FCM, etc.) rather than the default Compute Engine default account.
- **App Check:** enforce for callable/HTTP surfaces in production after clients register; see **`SECURITY_RUNBOOK.md`** and App Check init in `src/lib/firebase.ts`.

## HTTP responses

- Invalid JSON bodies return `400` with **sanitized** error detail length (`sanitizeHttpErrorDetail`).

## Browser shell (Firebase Hosting / static)

- **Content-Security-Policy** does not use `style-src 'unsafe-inline'` — styles come from the built CSS bundle and the Google Fonts stylesheet (`https://fonts.googleapis.com`). Icon “filled” state uses the `.material-symbol-fill-1` class; **StarkMap** animation lives in `src/index.css` instead of an inline `<style>` inside SVG.
- **`Cross-Origin-Opener-Policy: same-origin`** and **`Cross-Origin-Resource-Policy: same-origin`** are sent with hosting responses (`firebase.json`, `nginx.conf`). Sign-in is email/password and anonymous only today; if you add OAuth **popup** flows later, evaluate **`same-origin-allow-popups`** for COOP so the provider window can complete handoff to Firebase.

## Environments

- **Development:** local Vite, optional emulators, mock keys only in emulator paths.
- **Staging / production:** real project IDs, no mock keys, App Check and rules aligned with environment.

## Known limits

- Rate limiting is **per Cloud Functions instance**, not globally distributed without **Cloud Armor** / API Gateway.

## Abuse resistance

- Simulated repeated unauthorized-style access patterns and malformed payload flooding (see `abuse-simulation.test.ts` and `input-fuzzing.test.ts`).
- Verified rate limiting and validation safeguards under burst and randomized keys (`rate-limit-fuzz.test.ts`).

### Automated checks (file references)

- **`functions/src/__tests__/abuse-simulation.test.ts`** — repeated invalid / malformed payloads through validation and rate-limit paths; asserts no cross-key bucket bleed and predictable limiter behavior under bursts.
- **`functions/src/__tests__/rate-limit-fuzz.test.ts`** — randomized keys and burst patterns against the in-memory limiter.
- **`functions/src/__tests__/input-fuzzing.test.ts`** — randomized JSON-like objects through Zod schemas (`parseJsonBody`) and role checks; expects validation errors or success, never thrown exceptions from parsing.

These tests **do not** replace a WAF or centralized audit log review; they document that malformed input and abuse-style floods are rejected without destabilizing the handler surface in CI.
