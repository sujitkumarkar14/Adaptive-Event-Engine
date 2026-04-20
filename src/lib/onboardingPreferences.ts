import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { SystemPhase, TransportMode } from '../store/entryStore';

/** Stored under `users/{uid}` — merge-safe with other user fields (FCM token, etc.). */
export const USERS_COLLECTION = 'users';

export type OnboardingFirestoreShape = {
  transportMode: TransportMode;
  accessibility: {
    stepFree: boolean;
    lowSensory: boolean;
    visualAid: boolean;
  };
  journeyPhase: SystemPhase;
  onboardingCompleted: boolean;
};

const PHASES: SystemPhase[] = ['PRE_EVENT', 'IN_JOURNEY', 'ARRIVAL', 'EMERGENCY'];
function coercePhase(v: unknown): SystemPhase | null {
  return typeof v === 'string' && PHASES.includes(v as SystemPhase) ? (v as SystemPhase) : null;
}

function coerceTransport(v: unknown): TransportMode {
  if (v === null) return null;
  if (v === 'Car' || v === 'Metro' || v === 'Shuttle') return v;
  return null;
}

function coerceAccessibility(raw: unknown): OnboardingFirestoreShape['accessibility'] | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    stepFree: o.stepFree === true,
    lowSensory: o.lowSensory === true,
    visualAid: o.visualAid === true,
  };
}

/** Parse `users/{uid}.onboarding` from Firestore snapshot data (exported for tests). */
export function parseOnboardingFromUserData(data: Record<string, unknown> | undefined): OnboardingFirestoreShape | null {
  if (!data) return null;
  const ob = data.onboarding;
  if (!ob || typeof ob !== 'object') return null;
  const o = ob as Record<string, unknown>;
  const phase = coercePhase(o.journeyPhase);
  const transport = coerceTransport(o.transportMode);
  const acc = coerceAccessibility(o.accessibility);
  if (!phase || !acc) return null;
  return {
    transportMode: transport,
    accessibility: acc,
    journeyPhase: phase,
    onboardingCompleted: Boolean(o.onboardingCompleted),
  };
}

export async function fetchOnboardingPreferences(uid: string): Promise<OnboardingFirestoreShape | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return parseOnboardingFromUserData(snap.data() as Record<string, unknown>);
}

export async function persistOnboardingPreferences(uid: string, onboarding: OnboardingFirestoreShape): Promise<void> {
  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    {
      onboarding: {
        transportMode: onboarding.transportMode,
        accessibility: onboarding.accessibility,
        journeyPhase: onboarding.journeyPhase,
        onboardingCompleted: onboarding.onboardingCompleted,
      },
      onboardingUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Defaults used when the user skips configuration — consistent phase and cleared selections. */
export const SKIP_ONBOARDING_DEFAULTS: OnboardingFirestoreShape = {
  transportMode: null,
  accessibility: {
    stepFree: false,
    lowSensory: false,
    visualAid: false,
  },
  journeyPhase: 'IN_JOURNEY',
  onboardingCompleted: true,
};

export function toHydratePayload(prefs: OnboardingFirestoreShape) {
  return {
    phase: prefs.journeyPhase,
    transportMode: prefs.transportMode,
    accessibility: { ...prefs.accessibility },
  };
}
