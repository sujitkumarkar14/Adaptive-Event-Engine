import { describe, it, expect } from 'vitest';
import { entryReducer, type EntryState } from '../entryStore';

const base = (): EntryState => ({
  phase: 'PRE_EVENT',
  transportMode: null,
  accessibility: { stepFree: false, lowSensory: false, visualAid: false },
  isOnline: true,
  dataFreshness: new Date(0),
  lastSyncTimestamp: new Date(0),
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
});

describe('entryReducer', () => {
  it('SET_PHASE and SET_TRANSPORT_MODE', () => {
    let s = base();
    s = entryReducer(s, { type: 'SET_PHASE', payload: 'IN_JOURNEY' });
    expect(s.phase).toBe('IN_JOURNEY');
    s = entryReducer(s, { type: 'SET_TRANSPORT_MODE', payload: 'Car' });
    expect(s.transportMode).toBe('Car');
  });

  it('TOGGLE_ACCESSIBILITY_PREF flips nested flag', () => {
    let s = base();
    s = entryReducer(s, { type: 'TOGGLE_ACCESSIBILITY_PREF', payload: 'stepFree' });
    expect(s.accessibility.stepFree).toBe(true);
  });

  it('UPDATE_GATE_PRESSURE sets percent and a11y copy', () => {
    const at = new Date('2026-01-01T00:00:00Z');
    const s = entryReducer(base(), {
      type: 'UPDATE_GATE_PRESSURE',
      payload: { percent: 72, gateId: 'GATE_B', at },
    });
    expect(s.gatePressurePercent).toBe(72);
    expect(s.gatePressureGateId).toBe('GATE_B');
    expect(s.a11yStatus).toMatch(/72%/);
  });

  it('SET_BOOKING_STATUS and CLEAR_A11Y', () => {
    let s = entryReducer(base(), {
      type: 'SET_BOOKING_STATUS',
      payload: { status: 'success', transactionId: 'tx1' },
    });
    expect(s.bookingStatus).toBe('success');
    s = entryReducer(s, { type: 'CLEAR_A11Y' });
    expect(s.a11yStatus).toBe('');
  });

  it('SET_PREFERRED_CONTENT_LANGUAGE', () => {
    const s = entryReducer(base(), { type: 'SET_PREFERRED_CONTENT_LANGUAGE', payload: 'hi' });
    expect(s.preferredContentLanguage).toBe('hi');
  });
});
