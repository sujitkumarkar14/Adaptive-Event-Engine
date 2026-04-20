/**
 * Rounded percentage of ingress capacity already allocated (filled).
 * Matches booking cards: `(total - remaining) / total`, capped at 100%.
 */
export function slotIngressFillPercent(capacityTotal: number, capacityRemaining: number): number {
  const total = capacityTotal;
  if (total <= 0) return 0;
  const taken = Math.max(0, total - capacityRemaining);
  return Math.min(100, Math.round((taken / total) * 100));
}
