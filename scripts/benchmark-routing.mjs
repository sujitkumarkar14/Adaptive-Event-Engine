/**
 * Local synthetic benchmark for routing-adjacent work (polyline-ish string churn).
 * Not a Maps API latency measurement — see PERFORMANCE.md.
 */
export function runRoutingBench(iterations = 8000) {
  const t0 = performance.now();
  let s = '';
  for (let i = 0; i < iterations; i++) {
    s += String.fromCharCode(65 + (i % 26));
  }
  return Math.round(performance.now() - t0);
}
