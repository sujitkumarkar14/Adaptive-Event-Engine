import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../firebase', () => ({
  db: {},
}));

const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'gateLogistics/mock' })),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  Timestamp: class Timestamp {
    constructor(private d: Date) {}
    toDate() {
      return this.d;
    }
  },
}));

import { syncGatePressure } from '../firestore';

describe('syncGatePressure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches UPDATE_GATE_PRESSURE when snapshot exists', () => {
    const dispatch = vi.fn();

    mockOnSnapshot.mockImplementation((_ref: unknown, onNext: (s: unknown) => void) => {
      onNext({
        exists: () => true,
        data: () => ({ currentPressure: 82, lastUpdated: new Date('2024-01-01T00:00:00.000Z') }),
      });
      return vi.fn();
    });

    const unsub = syncGatePressure('GATE_X', dispatch);
    expect(typeof unsub).toBe('function');

    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe('UPDATE_GATE_PRESSURE');
    if (action.type === 'UPDATE_GATE_PRESSURE') {
      expect(action.payload.percent).toBe(82);
      expect(action.payload.gateId).toBe('GATE_X');
    }
  });

  it('does not dispatch when document is missing', () => {
    const dispatch = vi.fn();

    mockOnSnapshot.mockImplementation((_ref: unknown, onNext: (s: unknown) => void) => {
      onNext({
        exists: () => false,
        data: () => null,
      });
      return vi.fn();
    });

    syncGatePressure('GATE_Y', dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('prefers pressurePercent over currentPressure when both exist', () => {
    const dispatch = vi.fn();

    mockOnSnapshot.mockImplementation((_ref: unknown, onNext: (s: unknown) => void) => {
      onNext({
        exists: () => true,
        data: () => ({
          currentPressure: 50,
          pressurePercent: 77,
          lastUpdated: new Date(),
        }),
      });
      return vi.fn();
    });

    syncGatePressure('GATE_P', dispatch);
    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe('UPDATE_GATE_PRESSURE');
    if (action.type === 'UPDATE_GATE_PRESSURE') {
      expect(action.payload.percent).toBe(77);
    }
  });

  it('logs when snapshot errors', () => {
    const dispatch = vi.fn();
    const errLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSnapshot.mockImplementation(
      (_ref: unknown, _onNext: unknown, onErr: (e: Error) => void) => {
        onErr(new Error('permission-denied'));
        return vi.fn();
      }
    );
    syncGatePressure('GATE_Z', dispatch);
    expect(errLog).toHaveBeenCalled();
    errLog.mockRestore();
  });
});
