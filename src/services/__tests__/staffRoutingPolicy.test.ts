import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mergeRoutingPolicyLive } from '../staffRoutingPolicy';

const mockCallable = vi.fn().mockResolvedValue({ data: { ok: true } });

vi.mock('../../lib/firebase', () => ({
  functions: {},
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mockCallable),
}));

describe('staffRoutingPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallable.mockResolvedValue({ data: { ok: true } });
  });

  it('mergeRoutingPolicyLive forwards patch to callable', async () => {
    await mergeRoutingPolicyLive({
      gateRerouteActive: true,
      fromGate: 'GATE_IN',
      toGate: 'GATE_OUT',
      message: 'Test',
    });
    expect(mockCallable).toHaveBeenCalledWith(
      expect.objectContaining({
        gateRerouteActive: true,
        fromGate: 'GATE_IN',
        toGate: 'GATE_OUT',
        message: 'Test',
      })
    );
  });

  it('mergeRoutingPolicyLive propagates errors', async () => {
    mockCallable.mockRejectedValueOnce(new Error('permission-denied'));
    await expect(mergeRoutingPolicyLive({ message: 'x' })).rejects.toThrow('permission-denied');
  });
});
