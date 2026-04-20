import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGateEtasMatrix, formatMatrixInsight } from '../gateMatrix';

vi.mock('../../lib/firebase', () => ({
  functions: {},
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: { rankings: [], mode: 'mock' } })),
}));

describe('gateMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formatMatrixInsight returns null for empty input', () => {
    expect(formatMatrixInsight(undefined)).toBeNull();
    expect(formatMatrixInsight([])).toBeNull();
  });

  it('formatMatrixInsight returns single-gate sentence', () => {
    expect(
      formatMatrixInsight([{ gateId: 'GATE_A', durationSeconds: 360, distanceMeters: 400 }])
    ).toMatch(/GATE A is about 6 min walk/);
  });

  it('formatMatrixInsight compares two gates', () => {
    const s = formatMatrixInsight([
      { gateId: 'GATE_B', durationSeconds: 240, distanceMeters: 300 },
      { gateId: 'GATE_A', durationSeconds: 360, distanceMeters: 400 },
    ]);
    expect(s).toContain('GATE B');
    expect(s).toContain('GATE A');
    expect(s).toMatch(/4 min away/);
  });

  it('fetchGateEtasMatrix returns data on success', async () => {
    const { httpsCallable } = await import('firebase/functions');
    vi.mocked(httpsCallable).mockReturnValueOnce(
      vi.fn().mockResolvedValue({
        data: {
          rankings: [{ gateId: 'GATE_B', durationSeconds: 120, distanceMeters: 300 }],
          mode: 'mock' as const,
        },
      })
    );
    const res = await fetchGateEtasMatrix(34, -118);
    expect(res?.rankings?.[0]?.gateId).toBe('GATE_B');
  });

  it('fetchGateEtasMatrix returns null on failure', async () => {
    const { httpsCallable } = await import('firebase/functions');
    vi.mocked(httpsCallable).mockReturnValueOnce(vi.fn().mockRejectedValue(new Error('fail')));
    const res = await fetchGateEtasMatrix(0, 0);
    expect(res).toBeNull();
  });
});
