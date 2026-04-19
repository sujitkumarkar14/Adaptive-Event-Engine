import { describe, it, expect, vi } from 'vitest';
import { calculateOptimalPath } from '../routing';

describe('calculateOptimalPath', () => {
  it('returns mock route when USE_MOCK_DATA path (step-free vs stairs)', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const a = await calculateOptimalPath({
      originLat: 1,
      originLng: 2,
      destinationGate: 'GATE_A',
      stepFreeRequired: true,
    });
    expect(a).not.toBeNull();
    expect(a!.perimeterToSeatTime).toBe('18 mins');
    expect(a!.pathNodes[1].description).toBe('Elevator Bank C');
    expect(a!.status).toBe('OPTIMIZED_VIA_MOCK');

    const b = await calculateOptimalPath({
      originLat: 1,
      originLng: 2,
      destinationGate: 'GATE_A',
      stepFreeRequired: false,
    });
    expect(b!.perimeterToSeatTime).toBe('12 mins');
    expect(b!.pathNodes[1].description).toBe('Stairwell B');
    log.mockRestore();
  });
});
