/**
 * High-fidelity SVG map extracted from Stitch `resilient_live_dashboard_refined/code.html`
 * (Minimalist Map Mockup). Used when Maps Datasets API is unavailable.
 * Stark: square caps/joins, no rounded filters.
 */
export const STITCH_VENUE_SVG_FALLBACK = `<svg class="w-full h-full" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<pattern height="40" id="stitch-grid" patternUnits="userSpaceOnUse" width="40">
<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c1c6d6" stroke-dasharray="2,2" stroke-width="0.5"></path>
</pattern>
<rect fill="url(#stitch-grid)" height="100%" width="100%"></rect>
<path d="M50 50 L750 50 L750 350 L50 350 Z" fill="none" stroke="#c1c6d6" stroke-width="8"></path>
<path d="M200 50 L200 350 M400 50 L400 350 M600 50 L600 350" fill="none" stroke="#c1c6d6" stroke-width="4"></path>
<path d="M50 200 L750 200" fill="none" stroke="#c1c6d6" stroke-width="4"></path>
<path d="M70 330 L180 330 L180 220 L380 220 L380 70" fill="none" stroke="#005bbf" stroke-linecap="square" stroke-linejoin="miter" stroke-width="12"></path>
<rect fill="#005bbf" height="40" width="40" x="360" y="50"></rect>
<circle cx="70" cy="330" fill="#1a1b1e" r="10"></circle>
<text fill="#1a1b1e" font-family="Inter,sans-serif" font-size="12" font-weight="900" x="360" y="40">GATE 2 ENTRY</text>
<text fill="#1a1b1e" font-family="Inter,sans-serif" font-size="12" font-weight="900" x="60" y="360">CURRENT POSITION</text>
</svg>`;
