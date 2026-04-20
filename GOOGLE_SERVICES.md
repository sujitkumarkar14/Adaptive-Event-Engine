# Google services used

| Service | Used for | Why it matters |
|---------|----------|----------------|
| **Firebase Auth** | Sign-in, custom claims for roles | Staff vs attendee capabilities |
| **Firestore** | Live venue/gate/user state | Real-time coordination |
| **Cloud Functions** | Callables + HTTP + triggers | Server-only policy, Spanner proxy, FCM topic subscribe |
| **FCM** | Emergency + smart reroute topics | Push alerts without polling |
| **Remote Config** | Feature toggles (e.g. gate status) | Adjust behavior between events |
| **Cloud Spanner** (via Functions) | Slot reservation consistency | Reduce overbooking under contention |
| **Maps Platform** | Walking ETAs, gate matrix | Crowd movement guidance |
| **App Check** | Attenuate abuse on client calls | Optional; reCAPTCHA providers |
| **Cloud Build / Run** | CI/CD and hosting story | Deploy SPA and backends in GCP |

See **`README.md`** for narrative context and **`FUNCTIONS.md`** for function-level detail.
