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

## Local benchmark artifact

- **Script:** `npm run bench:perf` runs `scripts/write-perf-summary.mjs`, which executes small **synthetic** CPU benchmarks (`scripts/benchmark-routing.mjs`, `benchmark-booking.mjs`, `benchmark-broadcast.mjs`) and writes **`artifacts/perf-summary.json`**.
- **Optional:** set `PERF_INCLUDE_BUILD=1` to append `viteBuildMs` (runs `npm run build`; slower).
- These numbers are **not** Maps Routes latency, Spanner transaction time, or Cloud Functions cold start — they exist so reviewers see **measurable, checked-in** local timings with caveats.

## Concurrency snapshot (simulated)

- **Script:** `npm run bench:concurrency` runs `scripts/benchmark-concurrency.mjs`, which fans out **Promise.all** waves (default **50** concurrent tasks per wave; override with `BENCH_CONCURRENT`).
- **Output:** **`artifacts/concurrency-summary.json`** — includes **`avg_response_ms`** / **`p95_response_ms`** for two synthetic waves (`mock_booking_resolve`, `mock_reroute_eval`).
- This is **not** stadium-scale load testing; it is a **repeatable local signal** for parallel work and throughput-shaped metrics. For real load, use k6/GCP tests in your deployment environment.

## Scale simulation artifact (illustrative)

- **Script:** `npm run bench:scale` runs `scripts/write-scale-simulation.mjs` and writes **`artifacts/scale-simulation.json`**.
- **Fields:** `simulated_users`, `concurrent_requests`, `avg_latency_ms`, `p95_latency_ms`, `failure_rate` — **illustrative**; optionally derived from `concurrency-summary.json` when present.
- **Env:** `SCALE_SIM_USERS`, `SCALE_CONCURRENT` override defaults (**500** / **120**).
- This is **not** a production SLO or load-test result — it documents a **scale-shaped** checked-in snapshot for reviewers.

## Load / scale

This repo does **not** include load-test harnesses or stadium-scale benchmarks. Add k6, Artillery, or GCP load tests in your deployment project if required.
