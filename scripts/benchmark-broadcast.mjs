/**
 * Local synthetic benchmark for emergency payload serialization (HTTP body size stress).
 */
export function runBroadcastBench(size = 1200) {
  const t0 = performance.now();
  JSON.stringify({
    key: 'x'.repeat(size),
    type: 'EVAC',
    location: 'ALL',
    ts: Date.now(),
  });
  return Math.round(performance.now() - t0);
}
