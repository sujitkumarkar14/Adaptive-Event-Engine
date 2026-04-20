# Accessibility — Adaptive Entry 360

## Implemented

- **Skip link** to `#main-content` in `App.jsx`.
- **Semantic regions** and headings on major pages; **live regions** for alerts where used.
- **Keyboard:** focusable cards/buttons; Stark components use native `button` / labeled inputs.
- **TTS:** Web Speech API for evacuation/alert copy via `useTranslation` where enabled.
- **i18n hook** for user-facing strings.
- **Automated regression:** `vitest-axe` on selected screens (e.g. staff dashboard).
- **`prefers-reduced-motion`:** global CSS reduces animation/transition duration when the user requests reduced motion (`src/index.css`).

## Suggested manual checks

- Tab through login → onboarding → booking → dashboard; focus must be visible.
- Emergency / reroute messaging must not rely on color alone (icons/text duplicated).
- Test with OS high-contrast mode if targeting WCAG conformance beyond automated tests.

## Not claimed

- Full WCAG 2.x audit, contrast certification, or screen-reader sign-off are **out of scope** for this repo unless you add external audit artifacts.
