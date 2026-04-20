# Follow-up — external reviews & improvement backlog

Personal checklist derived from external reviews (problem statement: large-scale venue experience; rubric: code quality, security, efficiency, testing, accessibility, Google services). **Implement in priority order** (see bottom).

---

## Score history

| Review | Score | Notes |
|--------|-------|--------|
| Earlier | 73 → 82 | Initial hardening (rules, callable, CI, tests, README honesty). |
| Post-upgrade batch | **82** | Target was 97+; major gaps closed in repo. |
| Latest (same parameters) | **86 / 100** | README/docs, `FUNCTIONS.md`, persistence, rate limits, E2E, CI depth. |
| Evidence / docs / CI pass | **89 / 100** | Strong packaging for evaluation: evidence files, README, thresholds, scripts, CI breadth (external rescore). |

### Latest rubric — **89 / 100** (external rescore)

| Area | Score | Summary |
|------|-------|---------|
| Code quality | **19 / 20** | Clean repo signals, docs, CI; still feels demo-oriented with excellent packaging vs. fully product-grade. |
| Security | **18 / 20** | RBAC, rules, validation, rate limits, documented threat model; instance-local limits; thin end-to-end security proof. |
| Efficiency | **13 / 15** | Architecture + docs good; still no real scale/latency proof. |
| Testing | **15 / 20** | Breadth improved; depth still the limiter—E2E shallow, no emulator integration proof. |
| Accessibility | **14 / 15** | Real effort; contrast/SR/keyboard journey proof still light. |
| Google services | **10 / 10** | Sufficient; no need to overwork. |

**Final (external): 89 / 100** — best version so far; strong if automated scoring weights docs + CI heavily.

### Why 89 vs 86 (what improved)

- **Evidence files:** `ARCHITECTURE`, `DECISIONS`, `SECURITY`, `ACCESSIBILITY`, `PERFORMANCE`, `TESTING`, `GOOGLE_SERVICES`, `PROBLEM_ALIGNMENT`, `CONTRIBUTING`.
- **README:** engineering controls, role matrix, problem mapping, Google services table, performance + security + accessibility sections.
- **Coverage thresholds:** no longer purely symbolic (e.g. lines/statements ~55, branches/functions ~48).
- **`verify.sh` / `perf-report.sh`** exist.
- **CI:** lint, unit tests, coverage, build, Playwright, functions build/test — machine-readable.
- **Reduced motion** documented; security/abuse limits stated honestly.

### Verified in review environment (typical)

- Frontend lint + production build pass; bundle sizes honest (~206 kB main, ~471 kB Firebase, ~22 kB CSS order-of-magnitude).
- CI config present and broad; E2E + backend test files present.

### Caveat (reviewer environment)

Some sandboxes may not show a clean all-green run (e.g. Vitest or Functions **bus error**). **Do not treat that as repo broken**—score here is based on structure, configs, code, docs, and partial execution proof, not a full containerized green trace.

### Why not 95+ yet

1. **Testing** — E2E still thin (shell + redirects); no full flows for crowd/wait/coordination; no emulator-backed Auth/Firestore/Functions proof; coverage thresholds “respectable” not “impressive.”
2. **Efficiency** — no benchmark under load, stadium-scale fan-out, or slot reservation under concurrency.
3. **Security** — no distributed rate limit / WAF in repo; stronger authz integration tests; rotation/runbook/audit evidence optional.
4. **Accessibility** — posture good; missing contrast audit, SR walkthrough, keyboard-only full journey, more than one–two axe targets.

---

### Previous rubric snapshot — **86 / 100** (for comparison)

| Area | Score | Summary |
|------|-------|---------|
| Code quality | **18 / 20** | Strong identity, structure, README; some demo-oriented paths; ambition vs runtime proof. |
| Security | **17 / 20** | Rules, callable roles, secrets, Zod, timing-safe compare, per-IP rate limits; limits are **instance-local**; no WAF in repo; emulator story may be questioned. |
| Efficiency | **13 / 15** | Clean build, chunking, lazy routes, modern cache, honest targets; **~471 kB** Firebase chunk; **no benchmark/load proof** for stadium scale. |
| Testing | **14 / 20** | Unit + functions + axe + E2E; **coverage thresholds raised** in repo; still **no emulator integration** across Auth + Firestore + Functions. |
| Accessibility | **14 / 15** | Semantic intent, axe, honest README; **reduced-motion CSS** added; contrast audit / SR proof still optional. |
| Google services | **10 / 10** | Design centered on Firebase/GCP; not decorative. |

### Why 86 vs 82 (verified upgrades)

- README maps features to problem statement, roles, performance, security, bundles.
- **`FUNCTIONS.md`** exists (removes prior doc credibility gap).
- Firestore: **`persistentLocalCache` + `persistentMultipleTabManager`**; deprecated persistence API removed.
- **Rate limiting** on `vertexAggregator` & `broadcastEmergency` (per-IP sliding window in code).
- Security story: rules, callable, threat notes in README.
- **E2E** layer exists (small but real).
- **CI:** lint, unit tests, coverage, build, Playwright + E2E, functions build/test.

### What still caps the score (after doc + test pass)

1. **Testing depth** — E2E improved (4 scenarios) but not full login→slot→emergency; **no Firebase emulator integration** test harness yet.
2. **Performance** — `perf:report` prints Vite sizes; **no load test** for 50k scale.
3. **Rate limits** — instance-local only; no global gateway/WAF in repo.
4. **Accessibility** — **reduced-motion** CSS added; still no formal contrast audit / SR sign-off.

### Tone / positioning

Repo leans **venue operations + attendee guidance** more than **full fan experience platform** — fine if demo/README tie features back to **attendee outcomes**, not only control-room talk.

---

## Already implemented in repo (reference)

- [x] Firestore **`initializeFirestore`** + **`persistentLocalCache`** + **`persistentMultipleTabManager`**; tests use memory Firestore.
- [x] HTTP **rate limits** (`functions/src/httpRateLimit.ts`); env tunables; README + `FUNCTIONS.md` + Cloud Armor note.
- [x] README: problem mapping, role matrix, performance targets, security/threat, emulator note, testing commands, E2E.
- [x] Playwright **smoke** E2E + CI Chromium install.
- [x] Canvas stub in **`src/__tests__/setup.ts`** (quieter test output).

---

## Path to ~90+ (from 86 review)

- [x] **E2E expansion (partial):** smoke + **skip-link** + **protected `/booking` → login** (`e2e/`). Full login→slot→emergency still **optional** (needs credentials / emulator).
- [x] **Raise coverage thresholds** — set to ~**55/48/48/55** (lines/statements/functions/branches) with comment in `vitest.config.ts` (below measured ~63% lines).
- [x] **Measured performance note:** `npm run perf:report` (Vite gzip table); **`PERFORMANCE.md`**.
- [x] **`prefers-reduced-motion`** — global CSS in `index.css` + README/`ACCESSIBILITY.md`.
- [x] **Routing policy authorization tests** — `functions/src/routingPolicyAuth.test.ts` (production vs emulator roles).

---

## 98+ strategy — evidence density & “machine-obvious” maturity

*Goal: stronger **proof**, **structure**, **docs**, and **detectable** signals (CI, test layers, named scenarios), not only more features.*

### Code quality — look undeniably mature

- [x] Top-level **`ARCHITECTURE.md`**
- [x] **`DECISIONS.md`** (lightweight ADRs)
- [x] Short repo map in `ARCHITECTURE.md`
- [ ] Docstrings on **exported** critical APIs where missing (incremental)
- [x] **`CONTRIBUTING.md`**
- [x] **`scripts/verify.sh`** + **`npm run verify`**: lint → test → build → functions test/build
- [ ] Zero broken references / placeholder names in user-facing paths (spot-check as you ship)
- [x] README **“Engineering quality controls”**

### Security — push toward near-max

- [x] **`SECURITY.md`**
- [x] README **“Security controls implemented”**
- [x] Tests: **routing policy roles** (`routingPolicyAuth.test.ts`); **malformed HTTP** covered by Zod tests; **rate limit** (`httpRateLimit.test.ts`); unauthenticated callable path **not** integration-tested without emulator
- [x] **`sanitizeHttpErrorDetail`** on HTTP `400` JSON (`functions/src/sanitizeHttpError.ts`)
- [x] Env separation noted in `SECURITY.md` / `CONTRIBUTING.md`
- [ ] Comments on **demo-only** code paths vs production (incremental in Chaos Controller etc.)

### Efficiency — intentional performance story + proof

- [x] **`PERFORMANCE.md`**
- [x] Bundle table in README + `perf:report` script output
- [x] **`npm run perf:report`** (no bundle-visualizer yet — optional **`npm run analyze`** later)
- [x] README **“Efficiency measures”**

### Testing — biggest unlock for high scores

- [x] Layers documented in **`TESTING.md`**
- [x] **Raised** coverage thresholds (see `vitest.config.ts`)
- [ ] README CI badges (optional)
- [x] **Scenario-style E2E files:** `step-free-routing.spec.ts`, `attendee-booking-shell.spec.ts` (+ existing `app.spec.ts`)
- [ ] **`act(...)` warnings** — fix if they appear in CI
- [ ] **Firebase emulator** integration harness (future)

### Accessibility — farm real, checkable signals

- [x] **`ACCESSIBILITY.md`**
- [x] **`prefers-reduced-motion`** in CSS
- [x] README **“Accessibility features for large public venues”**
- [x] E2E **skip link** focus test

### Google services — impossible to miss

- [x] README table + **`GOOGLE_SERVICES.md`**
- [x] **“Why Google Cloud is core”** in README

### Problem statement alignment — mirror judging language

- [x] **`PROBLEM_ALIGNMENT.md`**

### “Evidence files” pack (short, structured)

- [x] `ARCHITECTURE.md`
- [x] `SECURITY.md`
- [x] `ACCESSIBILITY.md`
- [x] `PERFORMANCE.md`
- [x] `TESTING.md`
- [x] `PROBLEM_ALIGNMENT.md`
- [x] `GOOGLE_SERVICES.md`

---

## Effort buckets (from external advice)

### ~2 hours

- [x] README sections: security controls, a11y features, Google services table, problem alignment, engineering quality controls
- [x] `SECURITY.md`, `ACCESSIBILITY.md`, `TESTING.md` (short)
- [x] Raise coverage thresholds **or** document why they stay low
- [ ] Fix remaining test warnings (`act`, etc.) — if any in CI
- [x] Reduced-motion support + mention in README

### ~4–6 hours

- [x] Additional **scenario** E2E (skip link, protected booking route) — full login flows still optional
- [x] Authorization tests (`routingPolicyAuth.test.ts`)
- [x] Performance + `perf:report` script
- [x] `PROBLEM_ALIGNMENT.md`, `ARCHITECTURE.md`, `PERFORMANCE.md`

### ~1 day

- [ ] Saved **perf artifact** in repo (e.g. `docs/perf/sample.txt`) — optional
- [ ] Emulator-backed integration tests OR strong mocks at service boundary
- [ ] Screenshots/GIFs: reroute, congestion, emergency, a11y flow
- [x] `CONTRIBUTING.md` + `scripts/verify.sh`

---

## Practical priority order (if time is short)

1. Testing depth + clean CI output (`act`, thresholds, scenario test names)
2. Security docs + auth/routing policy tests
3. Problem-statement mapping file or README section
4. Accessibility docs + reduced motion + extra axe coverage
5. Performance doc + at least one measured metric
6. Google services table + “why GCP” paragraph
7. Architecture doc + verify script

---

## Hard truth (external)

Jump **86 → 98+** is less about “more ideas” and more about **evidence**, **structure**, **documentation**, and **machine-detectable** maturity (CI, named tests, top-level docs). Implement the checklists above incrementally.

---

## Roadmap — 95–98+ (external punch list)

**Principle:** Prefer **evidence** (tests, benchmarks, traces) over new markdown-only work. Tighten existing docs; add proof.

### What still moves the needle (89 → 95+)

1. **Scenario E2E** — not just redirects/shell; flows aligned to crowd movement, waits, coordination (mock or stub where Firebase blocks).
2. **Authorization / abuse integration tests** — callable + HTTP paths with repeated calls, malformed bodies, role matrix.
3. **Higher coverage floors** — e.g. lines/statements **65**, functions **60**, branches **55** (add tests until CI passes).
4. **Measured performance** — one artifact (JSON or table): load times, callable/booking/broadcast order-of-magnitude, caveats.
5. **More a11y proof** — 2–3 extra axe suites; keyboard/focus notes in `ACCESSIBILITY.md`.
6. **Optional:** `VALIDATION_MATRIX.md` mapping rubric → file/test evidence; `docs/screenshots/` for human reviewers.

### Phase 1 — highest score gain / fastest

| Priority | Action |
|----------|--------|
| 1 | Add scenario Playwright specs (names matter): `e2e/rerouting-under-congestion.spec.ts`, `e2e/emergency-broadcast-flow.spec.ts`, `e2e/attendee-slot-booking-flow.spec.ts`, `e2e/staff-policy-update-auth.spec.ts`, `e2e/multilingual-alert-flow.spec.ts` — exercise real UI where possible; mock network if needed. |
| 2 | Functions integration-style tests (folder or `__tests__/`): `authorization.integration.test.ts`, `rate-limit.integration.test.ts`, `emergency-payload-validation.test.ts`, `routing-policy-permissions.test.ts` — unauthenticated rejected; wrong role rejected; malformed rejected; rate limit 429 after N calls. |
| 3 | Raise `vitest.config.ts` thresholds toward **65 / 65 / 60 / 55** (lines / statements / functions / branches). |
| 4 | Eliminate **`act(...)`** warnings and noisy test console output. |

### Phase 2 — high impact, medium effort

| Priority | Action |
|----------|--------|
| 5 | Scripts: `scripts/benchmark-routing.ts`, `benchmark-booking.ts`, `benchmark-broadcast.ts` (local timing only is OK); output `artifacts/perf-summary.json`; refresh **`PERFORMANCE.md`**. |
| 6 | A11y: `src/__tests__/a11y.emergency-alert.spec.tsx`, `a11y.booking-flow.spec.tsx`, `a11y.reroute-banner.spec.tsx`, `a11y.staff-controls.spec.tsx` (axe + critical paths). |
| 7 | **`ACCESSIBILITY.md`** — keyboard walkthrough, focus management, contrast summary. |

### Phase 3 — packaging

| Priority | Action |
|----------|--------|
| 8 | **`VALIDATION_MATRIX.md`** — table: rubric category → evidence (file, test, CI job). |
| 9 | **`docs/screenshots/`** + README “Demo flows” section. |
| 10 | **`TESTING.md`** — sections titled to match the brief: crowd movement, waiting times, real-time coordination, accessibility, security tests. |

### Fastest implementation order (suggested)

1. `staff-policy-update-auth.spec.ts` + `authorization.integration.test.ts` + `routing-policy-permissions.test.ts` + raise thresholds + fix `act` warnings.  
2. Remaining scenario E2E + rate-limit + emergency payload integration tests.  
3. A11y specs + ACCESSIBILITY.md updates.  
4. Benchmark scripts + `artifacts/perf-summary.json` + PERFORMANCE.md.  
5. VALIDATION_MATRIX + screenshots + README links.

### Files to add (reference)

**E2E:** `rerouting-under-congestion`, `emergency-broadcast-flow`, `attendee-slot-booking-flow`, `staff-policy-update-auth`, `multilingual-alert-flow` (all under `e2e/*.spec.ts`).

**Functions tests:** `functions/src/__tests__/authorization.integration.test.ts`, `rate-limit.integration.test.ts`, `emergency-payload-validation.test.ts`, `routing-policy-permissions.test.ts` (adjust paths to match `vitest.config` exclude rules).

**Perf:** `scripts/benchmark-*.ts`, `artifacts/perf-summary.json`.

**Other:** `VALIDATION_MATRIX.md`, `docs/screenshots/*`.

### Definition of done (before freezing a release)

- [ ] `npm run lint` clean  
- [ ] `npm run build` clean  
- [ ] Frontend tests clean (no `act` noise)  
- [ ] `cd functions && npm test` clean  
- [ ] Playwright E2E clean  
- [ ] Coverage thresholds pass  
- [ ] Benchmark or perf artifact checked in (or explicitly deferred with reason)  
- [ ] README points to proof artifacts  

### Closing note

Avoid new product scope; invest hours in **test depth**, **clean output**, **benchmarks**, **auth/security validation**, and **accessibility proof**.

---

*Last updated: added external **89/100** rescore and 95–98+ punch list; prior work: evidence docs, verify/perf scripts, routing auth tests, reduced-motion, coverage floors, E2E shells, README.*

---

## Latest batch — implemented (repo)

Neutral summary of work landed after the punch list above; use this as a handoff for what exists in tree today.

### Testing

- **E2E (Playwright):** `high-congestion-reroute.spec.ts` (parallel contexts + rapid route churn), `emergency-during-booking.spec.ts`, `offline-recovery-flow.spec.ts`; semantic filenames `crowd-movement-reroute.spec.ts`, `waiting-time-booking.spec.ts`, `real-time-coordination.spec.ts` aligned with product themes.
- **Vitest:** `Booking.emergency.spec.tsx` (emergency phase + booking still visible); `offline-network.integration.spec.tsx` (footer Live/Offline); `a11y.focus-management.spec.tsx` (tab to SOS after reroute alert); `a11y.keyboard-full-flow.spec.tsx` (keyboard-only login tab order). Dependency: `@testing-library/user-event`.

### Performance / tooling

- **`scripts/benchmark-concurrency.mjs`** + **`npm run bench:concurrency`** → **`artifacts/concurrency-summary.json`** (simulated parallel waves; not production load).
- **`PERFORMANCE.md`** documents concurrency artifact; **`README.md`** links `bench:concurrency` next to `bench:perf`.

### Documentation

- **`README.md`:** **Failure handling** and **System guarantees** tables.
- **`ACCESSIBILITY.md`:** automated validation bullets, contrast note, keyboard/focus references.
- **`VALIDATION_MATRIX.md`**, **`TESTING.md`:** updated for new paths and themes.

### CI

- **`.github/workflows/ci.yml`:** Vitest **`--reporter=dot`** for unit and coverage steps to reduce log noise.

### Honest limits (still true)

- Full **multi-session Firestore + signed-in** flows need staging credentials or emulators; current E2E depth is strongest on **auth shells** + **unit/integration** proofs.
- **Concurrency JSON** is synthetic; real scale needs k6/GCP-style tests outside this repo.

### Optional next steps

- [ ] Wire **staging** (or emulator) E2E with real anonymous/email sign-in for dashboard + booking + emergency overlay in one run.
- [ ] Optional **load test** (k6) against Functions HTTP in a dedicated env.
- [ ] Optional **WCAG** contrast audit artifact if you need formal AA sign-off.
