import { describe, it, expect } from 'vitest';
import { getGateById, DEMO_GATES } from '../demoVenueLayout';

describe('demoVenueLayout', () => {
  it('getGateById returns gate config for known ids', () => {
    expect(getGateById('GATE_NORTH')?.displayName).toMatch(/Gate A/);
    expect(getGateById('GATE_EAST')).toBeDefined();
  });

  it('getGateById returns undefined for null or unknown', () => {
    expect(getGateById(null)).toBeUndefined();
    expect(getGateById('UNKNOWN')).toBeUndefined();
  });

  it('includes four gate zones', () => {
    expect(DEMO_GATES).toHaveLength(4);
  });
});
