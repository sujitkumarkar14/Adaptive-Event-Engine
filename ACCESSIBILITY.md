# Accessibility — Adaptive Entry 360

**Recorded audit (contrast methodology, screen reader notes, evidence map):** **`docs/accessibility-audit.md`**.

## Implemented

- **Skip link** to `#main-content` in `App.jsx`.
- **Semantic regions** and headings on major pages; **live regions** for alerts where used.
- **Keyboard:** focusable cards/buttons; Stark components use native `button` / labeled inputs.
- **TTS:** Web Speech API for evacuation/alert copy via `useTranslation` where enabled.
- **i18n hook** for user-facing strings.
- **Automated regression:** `vitest-axe` on staff dashboard, booking, reroute banner, chaos/emergency controls (`src/__tests__/a11y.*.spec.tsx`, `pages/__tests__/StaffDashboard.a11y.test.tsx`).
- **`prefers-reduced-motion`:** global CSS reduces animation/transition duration when the user requests reduced motion (`src/index.css`).

## Keyboard & focus walkthrough (manual)

1. **Login:** Tab from the browser chrome; the first focusable control should be the **skip** link (`Skip to primary content`). Activate it — focus should move into `#main-content`.
2. **Onboarding / booking / dashboard:** Primary actions use real `<button>` elements or links with visible labels; slot cards on booking are keyboard-activatable where not `FULL`.
3. **Reroute / alerts:** When `role="alert"` banners appear (e.g. staff reroute), screen readers should receive assertive announcements; do not rely on color alone (copy + icons).
4. **Staff tools:** Policy toggles and chaos/demo controls should keep focus order logical (top → form → primary action).

## Accessibility validation coverage

- **Keyboard-only navigation** — verified in segments for login, onboarding, and booking (`src/__tests__/a11y.full-keyboard-journey.spec.tsx`) plus full login tab order (`a11y.keyboard-full-flow.spec.tsx`).
- **Dynamic updates** — reroute `alert` uses **`aria-live="assertive"`** and **`aria-atomic="true"`** (`a11y.dynamic-content-announcement.spec.tsx`).
- **Focus management** — SOS focus after reroute alert (`a11y.focus-management.spec.tsx`); focus return after a simple dialog (`a11y.focus-recovery.spec.tsx`).
- **Reduced motion** — `prefers-reduced-motion` in `src/index.css` (see Implemented above).

### Stress validation

- Verified simultaneous dynamic updates: **global evacuation** plus **staff reroute** (`src/__tests__/a11y.dynamic-stress.spec.tsx`).
- Ensured **non-conflicting** assertive `role="alert"` regions (distinct copy per banner; no duplicate text nodes across alerts).
- Maintained **stable focus order** under rapid concurrent updates (Tab reaches SOS after both alerts are present).

### Automated validation signals (detail)

- **Keyboard-only login:** `src/__tests__/a11y.keyboard-full-flow.spec.tsx` tabs through the login form without pointer input.
- **Focus after assertive reroute alert:** `src/__tests__/a11y.focus-management.spec.tsx` checks that Tab reaches the SOS control after a reroute `alert` is present.
- **Screen reader–oriented flows:** Prefer testing with VoiceOver / NVDA on staging; this repo does not ship a screen-reader harness beyond **axe** + semantic HTML.

## Contrast

- Design tokens use Material-style surfaces and on-surface colors; **axe** runs on selected screens in CI.
- For **WCAG 2.1 AA** contrast certification, run a dedicated audit (e.g. browser contrast checker on primary text/button pairs) — not claimed as certified here.

## Suggested manual checks

- Tab through login → onboarding → booking → dashboard; focus must be visible.
- Emergency / reroute messaging must not rely on color alone (icons/text duplicated).
- Test with OS high-contrast mode if targeting WCAG conformance beyond automated tests.

## Not claimed

- Full WCAG 2.x audit, contrast certification, or screen-reader sign-off are **out of scope** for this repo unless you add external audit artifacts.
