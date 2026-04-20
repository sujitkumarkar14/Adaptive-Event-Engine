import React, { useCallback, useEffect, useState } from 'react';
import { useEntryStore, TransportMode } from '../store/entryStore';
import { StarkButton } from '../components/common/StarkComponents';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchOnboardingPreferences,
  persistOnboardingPreferences,
  SKIP_ONBOARDING_DEFAULTS,
  toHydratePayload,
  type OnboardingFirestoreShape,
} from '../lib/onboardingPreferences';

const SAVE_FAILED_COPY =
  "Couldn't save preferences. You can retry or continue with local settings only.";
const LOAD_FAILED_COPY = "Couldn't load saved preferences. You can still choose options below.";

export const Onboarding = () => {
  const { state, dispatch } = useEntryStore();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [initialLoadDone, setInitialLoadDone] = useState(() => user?.uid == null);
  const [saveState, setSaveState] = useState<'idle' | 'saving'>('idle');
  const [persistError, setPersistError] = useState<string | null>(null);
  const [loadBanner, setLoadBanner] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setInitialLoadDone(true);
      setLoadBanner(false);
      return;
    }
    let cancelled = false;
    setInitialLoadDone(false);
    setLoadBanner(false);
    void fetchOnboardingPreferences(user.uid)
      .then((prefs) => {
        if (cancelled) return;
        if (prefs) {
          dispatch({ type: 'HYDRATE_ONBOARDING', payload: toHydratePayload(prefs) });
        }
        setInitialLoadDone(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadBanner(true);
        setInitialLoadDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, dispatch]);

  const handleTransportSelect = (mode: TransportMode) => {
    dispatch({ type: 'SET_TRANSPORT_MODE', payload: mode });
  };

  const toggleAccessibility = (pref: keyof typeof state.accessibility) => {
    dispatch({ type: 'TOGGLE_ACCESSIBILITY_PREF', payload: pref });
  };

  const busy = !initialLoadDone || saveState === 'saving';

  const runPersistThenNavigate = useCallback(
    async (payload: OnboardingFirestoreShape) => {
      if (!user?.uid) {
        dispatch({ type: 'HYDRATE_ONBOARDING', payload: toHydratePayload(payload) });
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
        navigate('/dashboard');
        return;
      }
      setSaveState('saving');
      setPersistError(null);
      try {
        await persistOnboardingPreferences(user.uid, payload);
        dispatch({ type: 'HYDRATE_ONBOARDING', payload: toHydratePayload(payload) });
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
        navigate('/dashboard');
      } catch {
        setPersistError(SAVE_FAILED_COPY);
      } finally {
        setSaveState('idle');
      }
    },
    [user?.uid, dispatch, navigate]
  );

  const handleInitialize = () => {
    if (busy) return;
    const payload: OnboardingFirestoreShape = {
      transportMode: state.transportMode,
      accessibility: {
        stepFree: state.accessibility.stepFree,
        lowSensory: state.accessibility.lowSensory,
        visualAid: state.accessibility.visualAid,
      },
      journeyPhase: 'IN_JOURNEY',
      onboardingCompleted: true,
    };
    void runPersistThenNavigate(payload);
  };

  const handleSkip = () => {
    if (busy) return;
    void runPersistThenNavigate(SKIP_ONBOARDING_DEFAULTS);
  };

  const continueWithoutSaving = () => {
    setPersistError(null);
    dispatch({ type: 'SET_PHASE', payload: 'IN_JOURNEY' });
    dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    navigate('/dashboard');
  };

  return (
    <section
      className="flex flex-col h-full max-w-lg mx-auto"
      aria-busy={busy}
      aria-live="polite"
    >
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-4 leading-none">
          Travel <br /> Defined.
        </h1>
        <p className="text-on-surface-variant font-body text-lg leading-relaxed max-w-[80%]">
          Configure your transit environment for high-performance accessibility.
        </p>
      </div>

      {loadBanner && (
        <p
          role="status"
          className="mb-4 text-on-surface-variant font-bold text-xs uppercase tracking-widest border-l-4 border-outline pl-4"
        >
          {LOAD_FAILED_COPY}
        </p>
      )}

      {saveState === 'saving' && (
        <p role="status" className="mb-4 text-primary font-bold text-xs uppercase tracking-widest">
          Saving preferences…
        </p>
      )}

      {!initialLoadDone && user?.uid && (
        <p role="status" className="mb-4 text-outline font-bold text-xs uppercase tracking-widest">
          Loading your preferences…
        </p>
      )}

      {persistError && (
        <div className="mb-4 space-y-2" role="alert">
          <p className="text-error font-bold text-xs uppercase tracking-widest border-l-4 border-error pl-4">
            {persistError}
          </p>
          <button
            type="button"
            onClick={continueWithoutSaving}
            className="text-[10px] font-bold uppercase tracking-widest text-outline underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Continue without saving
          </button>
        </div>
      )}

      <div className="mb-10">
        <span
          id="transport-mode-label"
          className="font-['Inter'] font-bold uppercase tracking-widest text-xs text-outline mb-4 block"
        >
          Transport Mode
        </span>
        <div
          className="grid grid-cols-3 border-2 border-outline-variant"
          role="radiogroup"
          aria-labelledby="transport-mode-label"
        >
          {(
            [
              { mode: 'Car' as const, icon: 'directions_car', label: 'Car' },
              { mode: 'Metro' as const, icon: 'subway', label: 'Metro' },
              { mode: 'Shuttle' as const, icon: 'airport_shuttle', label: 'Shuttle' },
            ] as const
          ).map(({ mode, icon, label }, i, arr) => (
            <button
              key={mode}
              type="button"
              role="radio"
              disabled={busy}
              aria-checked={state.transportMode === mode}
              onClick={() => handleTransportSelect(mode)}
              className={`py-4 flex flex-col items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                i < arr.length - 1 ? 'border-r-2 border-outline-variant' : ''
              } ${
                state.transportMode === mode
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span
                className={`material-symbols-outlined normal-case ${state.transportMode === mode ? 'text-white' : ''}`}
                style={{ fontVariationSettings: "'FILL' 0" }}
                aria-hidden
              >
                {icon}
              </span>
              <span
                className={`text-[10px] tracking-widest uppercase ${state.transportMode === mode ? 'text-white' : ''}`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-12 space-y-4">
        <label className="font-['Inter'] font-bold uppercase tracking-widest text-xs text-outline mb-2 block">
          Accessibility Preferences
        </label>

        <button
          type="button"
          role="switch"
          disabled={busy}
          aria-checked={state.accessibility.stepFree}
          onClick={() => toggleAccessibility('stepFree')}
          className={`w-full cursor-pointer flex items-center justify-between p-5 border-l-4 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            state.accessibility.stepFree
              ? 'bg-surface-container-lowest border-primary-container text-on-surface'
              : 'bg-surface-container-lowest border-outline-variant text-on-surface'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="font-bold text-sm uppercase tracking-tight">Step-free access</span>
            <span className="text-xs text-on-surface-variant">Prioritize elevators and ramps</span>
          </div>
          <span className="sr-only">{state.accessibility.stepFree ? 'On' : 'Off'}</span>
          <div
            className={`w-12 h-6 shrink-0 relative flex items-center px-1 transition-colors ${
              state.accessibility.stepFree ? 'bg-primary-container justify-end' : 'bg-outline-variant justify-start'
            }`}
            aria-hidden
          >
            <div className="w-4 h-4 bg-white" />
          </div>
        </button>

        <button
          type="button"
          role="switch"
          disabled={busy}
          aria-checked={state.accessibility.lowSensory}
          onClick={() => toggleAccessibility('lowSensory')}
          className={`w-full cursor-pointer flex items-center justify-between p-5 border-l-4 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            state.accessibility.lowSensory
              ? 'bg-surface-container-lowest border-primary-container text-on-surface'
              : 'bg-surface-container-lowest border-outline-variant text-on-surface'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="font-bold text-sm uppercase tracking-tight">Low-sensory environments</span>
            <span className="text-xs text-on-surface-variant">Routes with reduced noise and light</span>
          </div>
          <span className="sr-only">{state.accessibility.lowSensory ? 'On' : 'Off'}</span>
          <div
            className={`w-12 h-6 shrink-0 relative flex items-center px-1 transition-colors ${
              state.accessibility.lowSensory ? 'bg-primary-container justify-end' : 'bg-outline-variant justify-start'
            }`}
            aria-hidden
          >
            <div className="w-4 h-4 bg-white" />
          </div>
        </button>

        <button
          type="button"
          role="switch"
          disabled={busy}
          aria-checked={state.accessibility.visualAid}
          onClick={() => toggleAccessibility('visualAid')}
          className={`w-full cursor-pointer flex items-center justify-between p-5 border-l-4 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            state.accessibility.visualAid
              ? 'bg-inverse-surface border-primary-container text-inverse-on-surface'
              : 'bg-surface-container-lowest border-outline-variant text-on-surface'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="font-bold text-sm uppercase tracking-tight">Visual aid support</span>
            <span
              className={`text-xs ${
                state.accessibility.visualAid ? 'text-inverse-on-surface opacity-80' : 'text-on-surface-variant'
              }`}
            >
              High-contrast UI and audio cues
            </span>
          </div>
          <span className="sr-only">{state.accessibility.visualAid ? 'On' : 'Off'}</span>
          <div
            className={`w-12 h-6 shrink-0 relative flex items-center px-1 transition-colors ${
              state.accessibility.visualAid ? 'bg-primary-container justify-end' : 'bg-outline-variant justify-start'
            }`}
            aria-hidden
          >
            <div className="w-4 h-4 bg-white" />
          </div>
        </button>
      </div>

      <div className="w-full h-48 mb-12 border-[1px] border-[#727785] overflow-hidden bg-surface-container-highest">
        {imageFailed ? (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-outline px-4 text-center">
            Venue imagery unavailable
          </div>
        ) : (
          <img
            alt="Clean public transport interior"
            className="w-full h-full object-cover grayscale brightness-110 contrast-125"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG7gMqh_b3DNv8ZzCapvwhCS-7auNnYXGM-lXKRDJUQOEKTIuLpKTrDCS35Tesss-jcnczzRnaTxHLlOWJXRP-1I7zWH3e67rzndiLUgJ0TJObxpaDZKAJRh1THcr6OmM6Cx6vykRL2r8B0ItonE14vQ_q-0UxFKCROHc7yFtC6brLMVjqCq5TDIodzu1mrP02N9TfY13yZDCUcf8SlttwzPn5St_24ntR9iIHl92RoGlmXFUPb75pSEznhQ9O_G_Spa9ss9wkvKzN"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className="mt-auto">
        <StarkButton fullWidth icon="arrow_forward" onClick={handleInitialize} disabled={busy}>
          Initialize System
        </StarkButton>
        <button
          type="button"
          onClick={handleSkip}
          disabled={busy}
          className="w-full py-4 text-outline font-bold uppercase tracking-widest text-[10px] mt-2 block text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          Skip configuration
        </button>
      </div>
    </section>
  );
};

export default Onboarding;
