import { describe, it, expect } from 'vitest';
import {
  parseOnboardingFromUserData,
  SKIP_ONBOARDING_DEFAULTS,
  toHydratePayload,
} from '../onboardingPreferences';

describe('onboardingPreferences', () => {
  it('parseOnboardingFromUserData returns null when onboarding missing', () => {
    expect(parseOnboardingFromUserData(undefined)).toBeNull();
    expect(parseOnboardingFromUserData({})).toBeNull();
  });

  it('parseOnboardingFromUserData maps a valid onboarding blob', () => {
    const parsed = parseOnboardingFromUserData({
      onboarding: {
        transportMode: 'Car',
        accessibility: { stepFree: true, lowSensory: false, visualAid: false },
        journeyPhase: 'IN_JOURNEY',
        onboardingCompleted: true,
      },
    });
    expect(parsed).toEqual({
      transportMode: 'Car',
      accessibility: { stepFree: true, lowSensory: false, visualAid: false },
      journeyPhase: 'IN_JOURNEY',
      onboardingCompleted: true,
    });
  });

  it('parseOnboardingFromUserData accepts null transportMode', () => {
    const parsed = parseOnboardingFromUserData({
      onboarding: {
        transportMode: null,
        accessibility: { stepFree: false, lowSensory: false, visualAid: false },
        journeyPhase: 'IN_JOURNEY',
        onboardingCompleted: true,
      },
    });
    expect(parsed?.transportMode).toBeNull();
  });

  it('toHydratePayload maps to entry store shape', () => {
    const h = toHydratePayload(SKIP_ONBOARDING_DEFAULTS);
    expect(h.phase).toBe('IN_JOURNEY');
    expect(h.transportMode).toBeNull();
  });

  it('parseOnboardingFromUserData returns null when journeyPhase is invalid', () => {
    expect(
      parseOnboardingFromUserData({
        onboarding: {
          transportMode: 'Car',
          accessibility: { stepFree: false, lowSensory: false, visualAid: false },
          journeyPhase: 'NOT_A_PHASE',
          onboardingCompleted: true,
        } as Record<string, unknown>,
      })
    ).toBeNull();
  });
});
