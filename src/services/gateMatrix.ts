import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { devWarn } from '../lib/debug';

export type GateEtaRanking = {
  gateId: string;
  durationSeconds: number;
  distanceMeters: number;
};

export type GateEtaResponse = {
  rankings: GateEtaRanking[];
  mode: 'mock' | 'distance_matrix';
};

/**
 * Distance Matrix — fastest gates from current coordinates (server: `request.data.origin` or lat/lng aliases).
 */
export async function fetchGateEtasMatrix(originLat: number, originLng: number): Promise<GateEtaResponse | null> {
  try {
    const callable = httpsCallable<
      { origin: { lat: number; lng: number } },
      GateEtaResponse
    >(functions, 'getGateEtasMatrix');
    const { data } = await callable({ origin: { lat: originLat, lng: originLng } });
    return data;
  } catch (e) {
    devWarn('[gateMatrix] getGateEtasMatrix failed', e);
    return null;
  }
}

export function formatMatrixInsight(rankings: GateEtaRanking[] | undefined): string | null {
  if (!rankings?.length) return null;
  const [first, second] = rankings;
  const m1 = Math.max(1, Math.round(first.durationSeconds / 60));
  const label1 = first.gateId.replace(/_/g, ' ');
  if (!second) {
    return `${label1} is about ${m1} min walk (fastest option).`;
  }
  const m2 = Math.max(1, Math.round(second.durationSeconds / 60));
  const label2 = second.gateId.replace(/_/g, ' ');
  return `${label1} is ${m1} min away (faster than ${label2} at ~${m2} min).`;
}
