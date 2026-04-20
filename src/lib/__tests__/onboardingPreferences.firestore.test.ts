import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOnboardingPreferences, persistOnboardingPreferences, SKIP_ONBOARDING_DEFAULTS } from '../onboardingPreferences';

const setDoc = vi.fn();
const getDoc = vi.fn();

vi.mock('../firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'users/x' })),
  getDoc: (...args: unknown[]) => getDoc(...args),
  setDoc: (...args: unknown[]) => setDoc(...args),
  serverTimestamp: vi.fn(() => ({ _ts: 'server' })),
}));

describe('onboardingPreferences Firestore IO', () => {
  beforeEach(() => {
    setDoc.mockReset();
    getDoc.mockReset();
  });

  it('fetchOnboardingPreferences returns parsed doc', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        onboarding: {
          transportMode: 'Shuttle',
          accessibility: { stepFree: true, lowSensory: false, visualAid: false },
          journeyPhase: 'ARRIVAL',
          onboardingCompleted: true,
        },
      }),
    });
    const out = await fetchOnboardingPreferences('u1');
    expect(out?.journeyPhase).toBe('ARRIVAL');
    expect(out?.transportMode).toBe('Shuttle');
  });

  it('persistOnboardingPreferences writes merge payload', async () => {
    await persistOnboardingPreferences('u2', SKIP_ONBOARDING_DEFAULTS);
    expect(setDoc).toHaveBeenCalledTimes(1);
    const opts = setDoc.mock.calls[0][2];
    expect(opts?.merge).toBe(true);
  });

  it('fetchOnboardingPreferences returns null when user doc is missing', async () => {
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    });
    await expect(fetchOnboardingPreferences('ghost')).resolves.toBeNull();
  });
});
