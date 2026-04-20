import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

/** Keys allowed to merge into `routingPolicy/live` (server enforces the same set). */
export type RoutingPolicyPatch = {
  gateRerouteActive?: boolean;
  fromGate?: string;
  toGate?: string;
  message?: string;
  emergency_vehicle_active?: boolean;
  clearZoneActive?: boolean;
  clearZoneSectors?: string[];
  autoTriggered?: boolean;
};

/**
 * Staff/ops: merge fields on `routingPolicy/live` via HTTPS callable (Firestore rules block direct client writes).
 * Production requires Firebase Auth custom claim `role` of `staff` or `admin`. Emulator: any authenticated user.
 */
export async function mergeRoutingPolicyLive(patch: RoutingPolicyPatch): Promise<void> {
  const callable = httpsCallable<RoutingPolicyPatch, { ok?: boolean }>(functions, 'updateRoutingPolicyLive');
  await callable(patch);
}
