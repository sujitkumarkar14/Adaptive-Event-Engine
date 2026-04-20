import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { readDemoSession, readDemoSeatSection } from '../lib/demoSession';

// --- STATE MACHINE TYPES ---
export type SystemPhase = 'PRE_EVENT' | 'IN_JOURNEY' | 'ARRIVAL' | 'EMERGENCY';
export type TransportMode = 'Car' | 'Metro' | 'Shuttle' | null;
export type BookingStatus = 'idle' | 'loading' | 'success' | 'error';

/** Evacuation / alert copy + Matrix UI (a11y inclusion — Hindi / Telugu). */
export type PreferredContentLanguage = 'en' | 'hi' | 'te';

export interface EntryState {
  phase: SystemPhase;
  transportMode: TransportMode;
  accessibility: {
    stepFree: boolean;
    lowSensory: boolean;
    visualAid: boolean;
  };
  isOnline: boolean;
  dataFreshness: Date | null;
  /** Last successful remote sync (Remote Config, gate pressure, etc.) */
  lastSyncTimestamp: Date | null;
  currentStationLocationId: string | null;
  /** Beacon-derived local gate label for dashboard routing UX */
  currentLocalGate: string | null;
  bleBeaconActive: boolean;
  fastPassActive: boolean;
  stepFreeRequired: boolean;
  gatePressurePercent: number | null;
  gatePressureGateId: string | null;
  bookingStatus: BookingStatus;
  bookingError: string | null;
  bookingTransactionId: string | null;
  /** Ephemeral copy for `aria-live` regions (BottomNav / Dashboard) */
  a11yStatus: string;
  /** Used for translated evacuation banners and concourse alerts. */
  preferredContentLanguage: PreferredContentLanguage;
  /** Live demo session (anonymous / judge flow) — see `demoSession.ts`. */
  demoMode: boolean;
  /** Firestore `demoEvents/{demoEventId}` when in demo mode. */
  demoEventId: string | null;
  /** Demo check-in ticket section (e.g. L3-124) for venue map — session-backed. */
  demoSeatSection: string | null;
}

export type EntryAction =
  | { type: 'SET_PHASE'; payload: SystemPhase }
  | { type: 'SET_TRANSPORT_MODE'; payload: TransportMode }
  | { type: 'TOGGLE_ACCESSIBILITY_PREF'; payload: keyof EntryState['accessibility'] }
  | { type: 'SET_NETWORK_STATUS'; payload: boolean }
  | { type: 'UPDATE_DATA_FRESHNESS'; payload: Date }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | {
      type: 'UPDATE_GATE_PRESSURE';
      payload: { percent: number; gateId: string; at: Date };
    }
  | { type: 'DETECT_BLE_BEACON'; payload: string }
  | { type: 'TRIGGER_EMERGENCY' }
  | { type: 'ACTIVATE_FAST_PASS' }
  | { type: 'API_FAILURE'; payload: string }
  | { type: 'TOGGLE_STEP_FREE'; payload: boolean }
  | {
      type: 'SET_BOOKING_STATUS';
      payload: {
        status: BookingStatus;
        error?: string | null;
        transactionId?: string | null;
      };
    }
  | { type: 'CLEAR_A11Y' }
  | { type: 'SET_PREFERRED_CONTENT_LANGUAGE'; payload: PreferredContentLanguage }
  /** Replace transport, accessibility, and phase from persisted onboarding (Firestore). */
  | {
      type: 'HYDRATE_ONBOARDING';
      payload: {
        phase: SystemPhase;
        transportMode: TransportMode;
        accessibility: EntryState['accessibility'];
      };
    }
  | { type: 'SET_DEMO_CONTEXT'; payload: { demoMode: boolean; demoEventId: string | null } }
  | { type: 'CLEAR_DEMO_CONTEXT' }
  | { type: 'SET_DEMO_SEAT_SECTION'; payload: string | null };

// --- INITIAL STATE ---
const initialState: EntryState = {
  phase: 'PRE_EVENT',
  transportMode: null,
  accessibility: {
    stepFree: false,
    lowSensory: false,
    visualAid: false,
  },
  isOnline: navigator.onLine,
  dataFreshness: new Date(),
  lastSyncTimestamp: new Date(),
  currentStationLocationId: null,
  currentLocalGate: null,
  bleBeaconActive: false,
  fastPassActive: false,
  stepFreeRequired: false,
  gatePressurePercent: null,
  gatePressureGateId: null,
  bookingStatus: 'idle',
  bookingError: null,
  bookingTransactionId: null,
  a11yStatus: '',
  preferredContentLanguage: 'en',
  demoMode: false,
  demoEventId: null,
  demoSeatSection: null,
};

// --- REDUCER (The Matrix Logic) ---
export function entryReducer(state: EntryState, action: EntryAction): EntryState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_TRANSPORT_MODE':
      return { ...state, transportMode: action.payload };
    case 'TOGGLE_ACCESSIBILITY_PREF':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          [action.payload]: !state.accessibility[action.payload],
        },
      };
    case 'SET_NETWORK_STATUS':
      return { ...state, isOnline: action.payload };
    case 'UPDATE_DATA_FRESHNESS':
      return { ...state, dataFreshness: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTimestamp: action.payload };
    case 'UPDATE_GATE_PRESSURE':
      return {
        ...state,
        gatePressurePercent: action.payload.percent,
        gatePressureGateId: action.payload.gateId,
        lastSyncTimestamp: action.payload.at,
        dataFreshness: action.payload.at,
        a11yStatus: `Gate pressure updated: ${action.payload.percent}% at ${action.payload.gateId}`,
      };
    case 'DETECT_BLE_BEACON':
      return {
        ...state,
        currentStationLocationId: action.payload,
        currentLocalGate: action.payload,
        bleBeaconActive: true,
        a11yStatus: `Beacon detected. Local gate ${action.payload}`,
      };
    case 'TRIGGER_EMERGENCY':
      return { ...state, phase: 'EMERGENCY' };
    case 'ACTIVATE_FAST_PASS':
      return { ...state, fastPassActive: true };
    case 'TOGGLE_STEP_FREE':
      return { ...state, stepFreeRequired: action.payload };
    case 'SET_BOOKING_STATUS':
      return {
        ...state,
        bookingStatus: action.payload.status,
        bookingError: action.payload.error ?? null,
        bookingTransactionId: action.payload.transactionId ?? null,
      };
    case 'CLEAR_A11Y':
      return { ...state, a11yStatus: '' };
    case 'SET_PREFERRED_CONTENT_LANGUAGE':
      return { ...state, preferredContentLanguage: action.payload };
    case 'HYDRATE_ONBOARDING':
      return {
        ...state,
        phase: action.payload.phase,
        transportMode: action.payload.transportMode,
        accessibility: { ...action.payload.accessibility },
      };
    case 'SET_DEMO_CONTEXT':
      return {
        ...state,
        demoMode: action.payload.demoMode,
        demoEventId: action.payload.demoEventId,
      };
    case 'CLEAR_DEMO_CONTEXT':
      return { ...state, demoMode: false, demoEventId: null, demoSeatSection: null };
    case 'SET_DEMO_SEAT_SECTION':
      return { ...state, demoSeatSection: action.payload };
    case 'API_FAILURE':
      console.warn(`[REILIENCE] API Error (${action.payload}). Yielding to last known Firestore IndexedDB cache.`);
      return state;
    default:
      return state;
  }
}

// --- CONTEXT SETUP ---
const EntryContext = createContext<{
  state: EntryState;
  dispatch: React.Dispatch<EntryAction>;
}>({ state: initialState, dispatch: () => null });

interface EntryProviderProps {
  children: ReactNode;
}

function initEntryState(): EntryState {
  if (typeof window === 'undefined') return initialState;
  const d = readDemoSession();
  const seat = readDemoSeatSection();
  if (d.demoMode && d.demoEventId) {
    return { ...initialState, demoMode: true, demoEventId: d.demoEventId, demoSeatSection: seat };
  }
  return initialState;
}

export const EntryProvider: React.FC<EntryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(entryReducer, initialState, initEntryState);

  React.useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_NETWORK_STATUS', payload: true });
      dispatch({ type: 'UPDATE_DATA_FRESHNESS', payload: new Date() });
    };
    const handleOffline = () => dispatch({ type: 'SET_NETWORK_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <EntryContext.Provider value={{ state, dispatch }}>{children}</EntryContext.Provider>;
};

export const useEntryStore = () => useContext(EntryContext);
