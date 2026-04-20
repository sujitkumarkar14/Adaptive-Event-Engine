# Accessibility audit summary

This document records **evidence-oriented** accessibility checks for the Adaptive Entry 360 web client. It complements automated **`vitest-axe`** runs and keyboard tests in `src/__tests__/a11y.*.spec.tsx`. It is **not** a third-party WCAG conformance certificate; it is a **repeatable audit trail** for reviewers.

**Last updated:** April 2026

---

## Scope

- **In scope:** Primary attendee flows (login, onboarding, booking, dashboard), staff dashboard surfaces covered by automated tests, emergency and reroute **assertive** banners, global **polite** / **assertive** live regions where implemented.
- **Out of scope:** Full product WCAG 2.x formal audit, native mobile apps, PDFs, and vendor content outside this repo.

---

## Contrast (WCAG 2.1 AA target)

| Check | Method | Result (summary) |
|-------|--------|------------------|
| Primary body / headings on default surfaces | Manual: browser DevTools **Accessibility** → **Contrast** (Chrome) or **Accessibility Insights** contrast checks on representative screens | **Pass (informal):** default text uses on-surface / on-surface-variant tokens on light surfaces; high-emergency banners use **text + layout + borders**, not color alone. |
| Error text on login | Same, on `#login` error `role="alert"` region when visible | **Pass (informal):** error copy on `error-container` / `on-error-container` pair reviewed for legibility. |
| Focus visibility | Keyboard tab through login → primary actions | **Pass:** `focus-visible` rings on Stark buttons/inputs (see `ACCESSIBILITY.md`). |

**Note:** Automated **axe** runs in CI catch many contrast issues on tested DOM trees; spot-check **high-contrast mode** (OS) on staging for regressions.

---

## Screen reader behavior (documented)

Assistive technology behavior is **manually spot-checked** on staging or local preview builds, in addition to **semantic HTML** and **live region** contracts enforced in tests.

| Tool | Platform | What was verified |
|------|----------|-------------------|
| **VoiceOver** | macOS / Safari or Chrome | **Login:** `h1` “Identity Gate” announced; tab order reaches guest, email, password, sign-in, create account. **Dashboard (when alerts fire):** multiple **`role="alert"`** regions with **`aria-live="assertive"`** and **`aria-atomic="true"`** announce evacuation and reroute copy without relying on color alone. |
| **NVDA** | Windows / Chrome or Firefox | Same primary flows: **landmarks** and **form labels** on login; **assertive** alerts when emergency/reroute mocks or live policy toggles surface banners. |

**Automated structural checks:** `src/__tests__/a11y.screen-reader-flow.spec.tsx` asserts **heading/label/alert** wiring for login error paths and **live region roles** on the dashboard shell (mocked Firestore), as a **proxy** for assistive tech—not a replacement for manual VoiceOver/NVDA runs.

---

## Dynamic alerts and live regions

| Behavior | Implementation | Test evidence |
|----------|----------------|---------------|
| Global evacuation | `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"` on dashboard (`Dashboard.tsx`) | `a11y.dynamic-stress.spec.tsx`, `a11y.screen-reader-flow.spec.tsx` |
| Staff reroute | Same pattern for reroute banner | `a11y.reroute-banner.spec.tsx`, `a11y.dynamic-stress.spec.tsx` |
| Polite status line | `aria-live="polite"` on screen-reader-only status (`Dashboard.tsx`) | Screen reader flow spec |
| Login errors | `role="alert"`, `aria-live="assertive"` when `error` state set | `a11y.screen-reader-flow.spec.tsx` |

---

## Focus behavior

- **Keyboard-only login:** `a11y.keyboard-full-flow.spec.tsx`
- **Focus after assertive reroute:** `a11y.focus-management.spec.tsx`
- **Simultaneous evac + reroute:** `a11y.dynamic-stress.spec.tsx` (Tab reaches SOS)

---

## Reduced motion

- Global CSS: `prefers-reduced-motion` reduces transitions (`src/index.css`). Verified by inspection; optional manual toggle in OS display settings.

---

## Gaps and follow-up

- No **external** VPAT or third-party audit PDF is attached; add one if procurement requires it.
- **i18n + screen readers:** dynamic language changes should be re-tested when new locales ship.
- **Contrast:** for formal **WCAG AA sign-off**, run a dedicated audit tool across **all** themes and staff surfaces not covered by axe snapshots.

---

## Related files

- **`ACCESSIBILITY.md`** — Feature list and manual checklist.
- **`VALIDATION_MATRIX.md`** — Traceability to tests and commands.
