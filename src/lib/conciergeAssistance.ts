/**
 * Deterministic venue-help copy (English) before Cloud Translation.
 * No LLM — short, accurate pointers to Dashboard and safety flows.
 */
export function buildConciergeAssistanceReply(query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) {
    return 'Ask a short question below. For live routing and emergencies, use the Dashboard.';
  }
  if (/(emergency|evacuat|sos|urgent|help me|hurt|medical)/i.test(q)) {
    return 'For urgent help, open the Dashboard and use SOS — staff receive your last known zone. Follow venue announcements and staff directions for evacuation.';
  }
  if (/(wheelchair|step\s*-?free|accessible|stairs|elevator|mobility)/i.test(q)) {
    return 'Open the Dashboard for the walking map with step-free routing when that preference is on. You can adjust accessibility in your journey settings from onboarding.';
  }
  if (/(gate|wayfind|where|direction|route|map|walk|how do i get)/i.test(q)) {
    return 'Open the Dashboard for your assigned gate, live pressure, and the walking route preview. Wait estimates and reroutes update there.';
  }
  if (/(food|restroom|water|bathroom|concourse|amenities)/i.test(q)) {
    return 'Use the Concourse Copilot area on the Dashboard for nearby points of interest on the venue map. Offerings depend on the event.';
  }
  if (/(book|slot|arrival|reservation|fast\s*-?pass)/i.test(q)) {
    return 'Use Arrival Booking to reserve an ingress window. After you confirm, your reservation reference appears on the Pass screen when available.';
  }
  return 'Thanks for your question. For live routing, arrivals, and safety alerts, use the Dashboard. This reply is translated into your selected language.';
}
