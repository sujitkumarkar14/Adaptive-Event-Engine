# GOAL — Adaptive Entry 360

## Mission (50+ words)

Adaptive Entry 360 is a venue operations and attendee guidance system: it turns live gate pressure, staff routing policy, and transactional booking into **actionable movement**—shorter walks, clearer egress, and fewer surprises in high-density events. The stack favors **Google Cloud**: Firestore for shared live state, Cloud Functions for policy and booking edges, optional **Cloud Spanner** for slot consistency, Maps for walking context, and FCM for coordination. Documentation and tests tie each surface to the problem statement so reviewers can trace **intent → code → verification**.

## Problem statement → feature map

| Problem dimension | What the repo ships | Where to look |
|-------------------|----------------------|---------------|
| **Crowd movement** | Live pressure in `gateLogistics`; staff reroute via `routingPolicy/live`; FCM `smart_reroute`; map/ETA helpers | `functions/src/index.ts`, `src/pages/Dashboard.tsx`, `src/services/gateMatrix.ts`, `PROBLEM_ALIGNMENT.md` |
| **Waiting times** | Spanner-backed `reserveEntrySlot`; congestion nudges; gate wait estimate card on dashboard | `functions/src/index.ts` (`reserveEntrySlot`), `src/pages/Dashboard.tsx`, `e2e/waiting-time-*.spec.ts` |
| **Real-time coordination** | Firestore listeners; global emergency doc; `broadcastEmergency`; `updateRoutingPolicyLive` | `functions/src/index.ts`, `firestore.rules`, E2E under `e2e/` |
| **Seamless / inclusive experience** | Lower **cognitive load** (clear next steps, wait transparency) over trivia; offline-tolerant cache; translation + TTS; skip link; axe tests; contrast audit | `ACCESSIBILITY.md`, `docs/accessibility-audit.md`, `PROBLEM_ALIGNMENT.md` §4, `src/hooks/useTranslation.tsx` |
| **Security & abuse** | Rules + callables; Zod on HTTP/callables; rate limits; `SECURITY.md` / `SECURITY_RUNBOOK.md` | `functions/src/validation.ts`, `SECURITY.md` |

## Optional “north stars” (not required to run the demo)

These are **documented** for alignment with advanced judging criteria; they are not all implemented as production features in this repository.

| Idea | Status | Notes |
|------|--------|--------|
| **Firebase App Check** | Documented + client hook | Enforce in Firebase Console for production; see `SECURITY.md`, `src/lib/firebase.ts` |
| **Gemini / Vertex “venue assistant”** | Future | Would need a callable proxy, billing, and prompt safety; Concierge today uses **Cloud Translation** + Places hints |
| **k6 / stadium spike load tests** | Skeleton | `tests/load/k6-venue-spike.js` — run with [k6](https://k6.io/) against preview or staging |
| **Gamification / “joy” layer** | Framed as UX clarity | Primary “enjoyment” is **less guessing and less stress** (see **`PROBLEM_ALIGNMENT.md`** §4); optional vouchers (`Vouchers`) are secondary |
| **TanStack Query** | Future | Would layer on top of Firestore/callables for cache policies; current hooks use listeners + explicit state |

## Related docs

- **`JUDGING_GUIDE.md`** — Rubric-style evidence map for reviewers (aligned with scoring / alignment checks).  
- **`PROBLEM_ALIGNMENT.md`** — Narrative mapping (same dimensions as this table).  
- **`DECISIONS.md`** — ADRs including Spanner vs Firestore (**ADR-004**).  
- **`VALIDATION_MATRIX.md`** — Requirements → tests / CI.
