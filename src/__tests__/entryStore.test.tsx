import { describe, it, expect, vi } from 'vitest';
import { entryReducer } from '../store/entryStore';
import { createTestEntryState } from './fixtures/entryStateFixture';

describe('entryReducer', () => {
  it('UPDATE_GATE_PRESSURE sets pressure, gate id, sync timestamps, and a11y copy', () => {
    const s = createTestEntryState();
    const at = new Date('2024-06-01T12:00:00.000Z');
    const next = entryReducer(s, {
      type: 'UPDATE_GATE_PRESSURE',
      payload: { percent: 77, gateId: 'GATE_B', at },
    });
    expect(next.gatePressurePercent).toBe(77);
    expect(next.gatePressureGateId).toBe('GATE_B');
    expect(next.lastSyncTimestamp).toEqual(at);
    expect(next.dataFreshness).toEqual(at);
    expect(next.a11yStatus).toContain('77%');
    expect(next.a11yStatus).toContain('GATE_B');
  });

  it('DETECT_BLE_BEACON sets station, local gate, ble flag, and a11y', () => {
    const s = createTestEntryState();
    const next = entryReducer(s, { type: 'DETECT_BLE_BEACON', payload: 'beacon-uuid-1' });
    expect(next.currentStationLocationId).toBe('beacon-uuid-1');
    expect(next.currentLocalGate).toBe('beacon-uuid-1');
    expect(next.bleBeaconActive).toBe(true);
    expect(next.a11yStatus).toContain('beacon-uuid-1');
  });

  it('SET_BOOKING_STATUS handles loading, success with transaction id, and error', () => {
    let s = createTestEntryState();
    s = entryReducer(s, { type: 'SET_BOOKING_STATUS', payload: { status: 'loading' } });
    expect(s.bookingStatus).toBe('loading');
    expect(s.bookingError).toBeNull();

    s = entryReducer(s, {
      type: 'SET_BOOKING_STATUS',
      payload: { status: 'success', transactionId: 'tx-99', error: null },
    });
    expect(s.bookingStatus).toBe('success');
    expect(s.bookingTransactionId).toBe('tx-99');

    s = entryReducer(s, {
      type: 'SET_BOOKING_STATUS',
      payload: { status: 'error', error: 'quota exceeded' },
    });
    expect(s.bookingStatus).toBe('error');
    expect(s.bookingError).toBe('quota exceeded');
  });

  it('SET_LAST_SYNC updates lastSyncTimestamp only', () => {
    const s = createTestEntryState();
    const t = new Date('2025-01-15T08:30:00.000Z');
    const next = entryReducer(s, { type: 'SET_LAST_SYNC', payload: t });
    expect(next.lastSyncTimestamp).toEqual(t);
  });

  it('CLEAR_A11Y clears a11yStatus', () => {
    const s = createTestEntryState({ a11yStatus: 'something' });
    const next = entryReducer(s, { type: 'CLEAR_A11Y' });
    expect(next.a11yStatus).toBe('');
  });

  it('TOGGLE_ACCESSIBILITY_PREF flips the requested key', () => {
    const s = createTestEntryState();
    const next = entryReducer(s, { type: 'TOGGLE_ACCESSIBILITY_PREF', payload: 'lowSensory' });
    expect(next.accessibility.lowSensory).toBe(true);
    expect(next.accessibility.stepFree).toBe(false);
  });

  it('ACTIVATE_FAST_PASS sets fastPassActive', () => {
    const s = createTestEntryState({ fastPassActive: false });
    const next = entryReducer(s, { type: 'ACTIVATE_FAST_PASS' });
    expect(next.fastPassActive).toBe(true);
  });

  it('SET_PHASE and SET_TRANSPORT_MODE apply payloads', () => {
    let s = createTestEntryState();
    s = entryReducer(s, { type: 'SET_PHASE', payload: 'IN_JOURNEY' });
    expect(s.phase).toBe('IN_JOURNEY');
    s = entryReducer(s, { type: 'SET_TRANSPORT_MODE', payload: 'Metro' });
    expect(s.transportMode).toBe('Metro');
  });

  it('TRIGGER_EMERGENCY forces EMERGENCY phase', () => {
    const s = createTestEntryState({ phase: 'ARRIVAL' });
    const next = entryReducer(s, { type: 'TRIGGER_EMERGENCY' });
    expect(next.phase).toBe('EMERGENCY');
  });

  it('API_FAILURE preserves state and logs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = createTestEntryState({ phase: 'IN_JOURNEY', bookingStatus: 'success' });
    const next = entryReducer(s, { type: 'API_FAILURE', payload: '502' });
    expect(next).toEqual(s);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('forces phase transition to EMERGENCY upon TRIGGER_EMERGENCY', () => {
    const initialState = {
      phase: 'PRE_EVENT',
      isOnline: true,
      fastPassActive: false,
    };

    const emergencyState = entryReducer(initialState as any, { type: 'TRIGGER_EMERGENCY' });
    expect(emergencyState.phase).toBe('EMERGENCY');

    const lockedState = entryReducer(emergencyState, { type: 'SET_PHASE', payload: 'ARRIVAL' });
    expect(lockedState.phase).not.toBe('PRE_EVENT');
  });

  it('retains previous state upon API_FAILURE', () => {
    const initialState = {
      phase: 'IN_JOURNEY',
      isOnline: true,
      fastPassActive: true,
    };

    const postFailureState = entryReducer(initialState as any, { type: 'API_FAILURE', payload: '502 Vertex AI' });

    expect(postFailureState.phase).toBe('IN_JOURNEY');
    expect(postFailureState.fastPassActive).toBe(true);
  });

  it('SET_NETWORK_STATUS toggles isOnline', () => {
    const initialState = {
      phase: 'ARRIVAL',
      isOnline: true,
      fastPassActive: false,
    };

    const offlineState = entryReducer(initialState as any, { type: 'SET_NETWORK_STATUS', payload: false });
    expect(offlineState.isOnline).toBe(false);
  });

  it('respects stepFreeRequired with TOGGLE_STEP_FREE and SET_PHASE', () => {
    const initialState = {
      phase: 'PRE_EVENT',
      isOnline: true,
      fastPassActive: false,
      stepFreeRequired: false,
    };

    const toggledAccessibilityState = entryReducer(initialState as any, { type: 'TOGGLE_STEP_FREE', payload: true });
    expect(toggledAccessibilityState.stepFreeRequired).toBe(true);

    const activeRoutingState = entryReducer(toggledAccessibilityState, {
      type: 'SET_PHASE',
      payload: 'IN_JOURNEY',
    });

    expect(activeRoutingState.phase).toBe('IN_JOURNEY');
    expect(activeRoutingState.stepFreeRequired).toBe(true);
  });
});
