/** Test seam for `calculateOptimalPath` — whether to use local polyline mock vs HTTPS callable. */
export function isRoutingMockEnabled(): boolean {
  return import.meta.env.VITE_USE_ROUTING_MOCK !== 'false';
}
