# Problem statement alignment

Maps the venue challenge to concrete features in this repository (same dimensions as the competition brief).

## 1. Crowd movement

- Live **gate pressure** in `gateLogistics`; **routing policy** (`routingPolicy/live`) for reroutes.
- **FCM** `smart_reroute` topic; map / **ETA** helpers for gate choice.
- **Step-free** and egress-oriented copy in emergency flows; navigation components for attendee movement.

## 2. Waiting times

- **Spanner** reservation path (`reserveEntrySlot`) for consistent slot booking.
- **Congestion nudges** when pressure crosses thresholds (Functions + FCM segmented sends).
- Alternate gate suggestions via policy + UI messaging.

## 3. Real-time coordination

- **Firestore** as shared live state; **FCM** for emergency and reroute pushes.
- **Staff** updates routing via **`updateRoutingPolicyLive`** callable; **global emergency** doc + broadcast HTTP path.

## 4. Seamless and enjoyable experience

**Enjoyable experience is achieved not through gamification, but through the reduction of cognitive load**—ensuring attendees never have to guess where to go or how long they will wait. Clear routing, wait transparency, and consistent “Stark” UI copy reduce decision fatigue in noisy venues.

**Real-time coordination** (Firestore listeners + FCM) **reduces the stress of dead zones** in large venues: when policy or density changes, attendees and staff see coordinated updates instead of stale assumptions—supporting a calmer flow even during peak congestion.

Supporting mechanics:

- Offline-tolerant **Firestore cache**; **translation** hook; **TTS** for critical alerts.
- **Accessibility:** skip link, landmarks, reduced-motion support, axe regression tests.
- **Concierge** / onboarding surfaces for guided flows.

Keep demos tied to **attendee outcomes** (shorter walks, clearer egress), not only operator dashboards.
