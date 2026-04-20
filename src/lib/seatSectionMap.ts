/**
 * Parses demo seed seat labels (`L{level}-{seat}`, e.g. `L3-124`) for wayfinding UI.
 * Levels are 1–5 matching `scripts/seed-nms-demo.cjs` `L${1 + (i % 5)}`.
 */
export function parseDemoSeatLevel(seatSection: string | null | undefined): number | null {
  if (!seatSection || typeof seatSection !== 'string') return null;
  const m = seatSection.trim().match(/^L([1-5])-/i);
  if (!m) return null;
  return parseInt(m[1]!, 10);
}
