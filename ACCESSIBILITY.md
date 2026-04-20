# Accessibility — Adaptive Entry 360

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

## Suggested manual checks

- Tab through login → onboarding → booking → dashboard; focus must be visible.
- Emergency / reroute messaging must not rely on color alone (icons/text duplicated).
- Test with OS high-contrast mode if targeting WCAG conformance beyond automated tests.

## Not claimed

- Full WCAG 2.x audit, contrast certification, or screen-reader sign-off are **out of scope** for this repo unless you add external audit artifacts.
