import type { EntryState } from '../../store/entryStore';

/** Deterministic full state for reducer unit tests. */
export function createTestEntryState(overrides?: Partial<EntryState>): EntryState {
  return {
    phase: 'PRE_EVENT',
    transportMode: null,
    accessibility: { stepFree: false, lowSensory: false, visualAid: false },
    isOnline: true,
    dataFreshness: new Date('2020-01-01T00:00:00.000Z'),
    lastSyncTimestamp: new Date('2020-01-01T00:00:00.000Z'),
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
    ...overrides,
  };
}
