/**
 * Local synthetic benchmark for slot-selection style filtering (callable path is network-bound).
 */
export function runBookingBench(slotCount = 600) {
  const t0 = performance.now();
  const slots = Array.from({ length: slotCount }, (_, i) => ({
    id: String(i),
    busy: i % 3 === 0,
  }));
  slots.filter((x) => !x.busy);
  return Math.round(performance.now() - t0);
}
