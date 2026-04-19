# Adaptive Entry 360  
**A Google Cloud Native Venue Choreography Engine**

Adaptive Entry 360 is not a standard React prototype. It is a functionally resilient, offline-first choreography engine built specifically for 132k-capacity stadium parameters leveraging edge computing and split-path Google Cloud architectures.

## The Architecture (Split Path)

We structured the engine to bypass cellular congestion points natively by splitting the logic into two paths:

1.  **The "Hot Path" (Firestore + IndexedDB)**
    Primary synchronization passes through Firebase utilizing `enableIndexedDbPersistence`. When a venue encounters a massive 0kbps cellular blackout, the React state-machine natively yields to the last known cache, allowing security routing to operate completely offline.
    
2.  **The "Analytical Path" (Cloud Spanner + Cloud Run)**
    When you attempt to book a slot alongside 10,000 other attendees, that payload routes to a specific Cloud Function protected by Google Cloud Secret Keys (`defineSecret`). It hits **Google Cloud Spanner** invoking a strict `database.runTransactionAsync` consistency lock to prevent database overbooking at global scale natively.

## 189 kB (The Speed Constraint)
To operate efficiently in crushing cell-density situations, we eradicated heavy component libraries. 
*   **Stark Architect Protocol:** Relying entirely on CSS classes (`0px` radii, no shadows, binary contrasts).
*   **Vite Native Chunking:** React Router operates under extreme boundaries parsing all routes through `React.lazy()` and `Suspense`. The fundamental Javascript payload executing on a user's phone is currently restricted to **189 kB**.

## Demo Mode & Chaos Controller
We engineered a built-in testing dashboard. The **Chaos Controller** explicitly proves system behavior:
*   Inject `502 Vertex AI` surges. The store isolates the dirty data.
*   Collapse the network to 0kbps to trigger deterministic heuristics instantly.
*   Trigger a **Global Emergency Fire-Drill** testing the WebSocket Mesh.

## Web Accessibility (AAA Compliant)
WCAG constraints are deeply integrated at the source.
*   The `useTranslation` hook catches Emergency WebSocket payloads and fires the **Web Speech API (`SpeechSynthesisUtterance`)** to bypass visual sight restrictions in smoke or crush scenarios natively speaking evacuation paths.
*   **Keyboard Absolute Navigation:** Fully operable via Tab/Escape keystrokes, utilizing structured `role="region"`, `aria-label`, and `Skip To Content` DOM skips at the index level natively, proven via mapped Vitest mock payloads.

---
**Deployment target:** Google Cloud Run (asia-south1). NGINX unprivileged GZIP edge container.  
**Tech Scale:** React 19, Google Cloud Spanner, Vertex AI Vision, Maps Platforms Datasets API.
