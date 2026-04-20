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
    expect(a!.encodedPolyline).toBeDefined();
    expect(typeof a!.encodedPolyline).toBe('string');
    expect(a!.encodedPolyline!.length).toBeGreaterThan(4);
    expect(a!.distanceMeters).toBe(420);
    expect(a!.durationSeconds).toBe(1080);

    const b = await calculateOptimalPath({
      originLat: 1,
      originLng: 2,
      destinationGate: 'GATE_A',
      stepFreeRequired: false,
    });
    expect(b!.perimeterToSeatTime).toBe('12 mins');
    expect(b!.pathNodes[1].description).toBe('Stairwell B');
    expect(b!.durationSeconds).toBe(720);
    log.mockRestore();
  });

  it('uses parking destination when returnToVehicle is true (mock path)', async () => {
    const r = await calculateOptimalPath({
      originLat: 10,
      originLng: -20,
      destinationGate: 'GATE_A',
      stepFreeRequired: false,
      priority: 'standard',
      returnToVehicle: true,
    });
    expect(r).not.toBeNull();
    expect(r!.perimeterToSeatTime).toBe('9 mins to lot');
    expect(r!.pathNodes.length).toBe(2);
    expect(r!.pathNodes[1].description).toBe('Parking zone');
    expect(r!.status).toBe('OPTIMIZED_VIA_MOCK');
  });

  it('mock: vip and emergency priorities use distinct polylines and timings', async () => {
    const vip = await calculateOptimalPath({
      originLat: 1,
      originLng: 2,
      destinationGate: 'GATE_A',
      stepFreeRequired: false,
      priority: 'vip',
    });
    expect(vip!.encodedPolyline).toBe('wocsF`b}u_@}@wAqCnE');
    expect(vip!.perimeterToSeatTime).toBe('14 mins (suite)');

    const em = await calculateOptimalPath({
      originLat: 1,
      originLng: 2,
      destinationGate: 'GATE_A',
      stepFreeRequired: false,
      priority: 'emergency',
    });
    expect(em!.encodedPolyline).toBe('oocsFjb}u_@_@?}L?kL');
    expect(em!.durationSeconds).toBe(360);
    expect(em!.distanceMeters).toBe(890);
  });
});
