import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FACILITY_STATUS,
  mergeFacilityStatus,
  washroomVacant,
  verticalIsBlocked,
  verticalStatusLabel,
  packAmenitiesNearGate,
  sortWashroomsForUi,
  inferNearGateFromStore,
  parseFirestoreFacilityData,
} from '../demoVenueFacilityModel';

describe('mergeFacilityStatus', () => {
  it('returns defaults when remote is null', () => {
    const m = mergeFacilityStatus(null);
    expect(m.escalators['E-131']).toBe('available');
    expect(m.escalators['E-145']).toBe('jammed');
    expect(m.elevators['EV-41']).toBe('jammed');
    expect(m.washrooms['WR-A-02']?.occupied).toBe(true);
  });

  it('merges partial Firestore overrides', () => {
    const m = mergeFacilityStatus({
      escalators: { 'E-145': 'available' },
      elevators: { 'EV-41': 'available' },
    });
    expect(m.escalators['E-145']).toBe('available');
    expect(m.escalators['E-131']).toBe('available');
    expect(m.elevators['EV-41']).toBe('available');
    expect(m.elevators['EV-56']).toBe('available');
  });
});

describe('washroomVacant', () => {
  it('treats missing key as vacant', () => {
    expect(washroomVacant(DEFAULT_FACILITY_STATUS, 'WR-UNKNOWN')).toBe(true);
  });

  it('detects occupied stalls', () => {
    expect(washroomVacant(DEFAULT_FACILITY_STATUS, 'WR-A-02')).toBe(false);
    expect(washroomVacant(DEFAULT_FACILITY_STATUS, 'WR-A-01')).toBe(true);
  });
});

describe('verticalStatusLabel', () => {
  it('maps status to user-facing labels', () => {
    expect(verticalStatusLabel('available')).toMatch(/available/i);
    expect(verticalStatusLabel('jammed')).toMatch(/jammed/i);
    expect(verticalStatusLabel('reduced')).toMatch(/reduced/i);
  });
});

describe('verticalIsBlocked', () => {
  it('true only for jammed', () => {
    expect(verticalIsBlocked('jammed')).toBe(true);
    expect(verticalIsBlocked('available')).toBe(false);
    expect(verticalIsBlocked('reduced')).toBe(false);
  });
});

describe('packAmenitiesNearGate', () => {
  it('returns Gate A amenities with escalators 131/145 and elevators 41/43/56', () => {
    const p = packAmenitiesNearGate('GATE_NORTH', DEFAULT_FACILITY_STATUS);
    expect(p).not.toBeNull();
    expect(p!.gate.displayName).toMatch(/Gate A/);
    expect(p!.escalators.map((e) => e.node.label).sort()).toEqual(['131', '145']);
    const e131 = p!.escalators.find((e) => e.node.id === 'E-131');
    const e145 = p!.escalators.find((e) => e.node.id === 'E-145');
    expect(e131?.status).toBe('available');
    expect(e145?.status).toBe('jammed');

    const ev41 = p!.elevators.find((e) => e.node.label === '41');
    const ev43 = p!.elevators.find((e) => e.node.label === '43');
    expect(ev41?.status).toBe('jammed');
    expect(ev43?.status).toBe('available');
  });
});

describe('sortWashroomsForUi', () => {
  it('lists vacant washrooms before occupied', () => {
    const p = packAmenitiesNearGate('GATE_NORTH', DEFAULT_FACILITY_STATUS)!;
    const sorted = sortWashroomsForUi(p.washrooms);
    expect(sorted[0]!.vacant).toBe(true);
    expect(sorted[sorted.length - 1]!.occupied).toBe(true);
  });
});

describe('parseFirestoreFacilityData', () => {
  it('returns null for empty or invalid payloads', () => {
    expect(parseFirestoreFacilityData(null)).toBeNull();
    expect(parseFirestoreFacilityData({})).toBeNull();
    expect(parseFirestoreFacilityData('x')).toBeNull();
  });

  it('parses nested washrooms and vertical transport', () => {
    const p = parseFirestoreFacilityData({
      washrooms: { 'WR-A-01': { occupied: true } },
      escalators: { 'E-131': 'jammed' },
      elevators: { 'EV-43': 'reduced' },
    });
    expect(p?.washrooms['WR-A-01']?.occupied).toBe(true);
    expect(p?.escalators['E-131']).toBe('jammed');
    expect(p?.elevators['EV-43']).toBe('reduced');
  });
});

describe('inferNearGateFromStore', () => {
  it('falls back to Gate North', () => {
    expect(inferNearGateFromStore(null, null)).toBe('GATE_NORTH');
  });

  it('uses gate pressure id when it matches a layout gate', () => {
    expect(inferNearGateFromStore('GATE_EAST', null)).toBe('GATE_EAST');
  });
});
