# Performance — Adaptive Entry 360

## Bundle & build

Run `npm run build` and read Vite output, or `npm run perf:report` to print the gzip table.

Typical production output (see `README.md` for latest):

| Chunk | Minified (approx.) | Gzip (approx.) |
|-------|--------------------|----------------|
| Main app (`index-*.js`) | ~206 kB | ~65 kB |
| Firebase SDK | ~470 kB | ~142 kB |

## Strategies

- **Route-level code splitting** via `React.lazy` in `App.jsx`.
- **Firebase** isolated in its own async chunk.
- **Firestore:** `persistentLocalCache` + multi-tab manager for offline-friendly reads.
- **Realtime:** Firestore listeners and FCM topics instead of polling where possible.

## Targets

Indicative numbers (not SLAs) are in `README.md` — Firestore snapshot latency, callable RTT, FCM delivery.

## Load / scale

This repo does **not** include load-test harnesses or stadium-scale benchmarks. Add k6, Artillery, or GCP load tests in your deployment project if required.
