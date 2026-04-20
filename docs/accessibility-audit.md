# Accessibility audit summary

This document records **evidence-oriented** accessibility checks for the Adaptive Entry 360 web client. It complements automated **`vitest-axe`** runs and keyboard tests in `src/__tests__/a11y.*.spec.tsx`. It is **not** a third-party WCAG conformance certificate; it is a **repeatable audit trail** for reviewers.

**Last updated:** April 2026

---

## Scope

- **In scope:** Primary attendee flows (login, onboarding, booking, dashboard), staff dashboard surfaces covered by automated tests, emergency and reroute **assertive** banners, global **polite** / **assertive** live regions where implemented.
- **Out of scope:** Full product WCAG 2.x formal audit, native mobile apps, PDFs, and vendor content outside this repo.

---

## Contrast (WCAG 2.1 AA target)

Ratios use the **relative luminance** formula (WCAG 2.1 success criterion 1.4.3) on hex values from `tailwind.config.js` (design tokens). Normal text requires **4.5:1**; large text (18pt+ or 14pt+ bold) **3:1**; non-text UI focus indicators **3:1** where applicable.

| Element | Foreground | Background | Ratio | WCAG AA (normal 4.5:1) |
|---------|------------|--------------|-------|-------------------------|
| Body text | `#1a1b1e` (`on-surface`) | `#faf9fd` (`surface`) | **16.43:1** | PASS |
| Login / form error text | `#93000a` (`on-error-container`) | `#ffdad6` (`error-container`) | **7.24:1** | PASS |
| Primary button label | `#ffffff` (`on-primary`) | `#005bbf` (`primary`) | **6.46:1** | PASS |
| Focus ring (primary on surface) | `#005bbf` | `#faf9fd` | **6.17:1** | PASS |
| Global evac banner (current) | `#ba1a1a` (`text-error`) | `#000000` | **3.25:1** | **Below 4.5:1** — acceptable for **large / bold** display type (3:1); borders + copy reduce reliance on color alone. Prefer `#ffffff` on `#ba1a1a` (**6.46:1**) for small error text. |

**Method:** computed in-repo with the WCAG luminance formula (same as Chrome DevTools contrast). Re-verify in **Chrome → Inspect → Accessibility → Contrast** after visual changes.

**Note:** Automated **axe** runs in CI still act as regression guards; this table is the **numeric** evidence trail.

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
