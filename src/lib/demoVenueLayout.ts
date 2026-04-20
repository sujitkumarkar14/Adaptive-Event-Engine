/**
 * Static schematic layout for the demo stadium map (Motera-style bowl).
 * Gate "A" in product copy maps to seeded `GATE_NORTH`.
 */

export type Point = { x: number; y: number };

export type DemoGateZone = {
  id: 'GATE_NORTH' | 'GATE_EAST' | 'GATE_SOUTH' | 'GATE_WEST';
  /** e.g. "Gate A" for north. */
  displayName: string;
  anchor: Point;
};

export type DemoCorridor = { id: string; d: string; label?: string };

export type DemoWashroomNode = {
  id: string;
  label: string;
  nearGateId: DemoGateZone['id'];
  anchor: Point;
};

export type DemoVendingNode = {
  id: string;
  label: string;
  nearGateId: DemoGateZone['id'];
  anchor: Point;
};

export type DemoEscalatorNode = {
  id: string;
  /** Human label e.g. "131". */
  label: string;
  nearGateId: DemoGateZone['id'];
  anchor: Point;
};

export type DemoElevatorNode = {
  id: string;
  label: string;
  nearGateId: DemoGateZone['id'];
  anchor: Point;
};

export const DEMO_GATES: readonly DemoGateZone[] = [
  { id: 'GATE_NORTH', displayName: 'Gate A (North)', anchor: { x: 120, y: 360 } },
  { id: 'GATE_EAST', displayName: 'Gate B (East)', anchor: { x: 880, y: 360 } },
  { id: 'GATE_SOUTH', displayName: 'Gate C (South)', anchor: { x: 500, y: 620 } },
  { id: 'GATE_WEST', displayName: 'Gate D (West)', anchor: { x: 120, y: 620 } },
] as const;

export const DEMO_CORRIDORS: readonly DemoCorridor[] = [
  {
    id: 'COR-A-main',
    d: 'M 200 360 L 420 360 L 420 260 L 580 260 L 580 480 L 420 480 L 420 360',
    label: 'Main concourse loop',
  },
  { id: 'COR-A-spur', d: 'M 200 360 L 200 200 L 500 200', label: 'Upper ring' },
];

export const DEMO_WASHROOMS: readonly DemoWashroomNode[] = [
  { id: 'WR-A-01', label: 'Washroom A-01', nearGateId: 'GATE_NORTH', anchor: { x: 240, y: 300 } },
  { id: 'WR-A-02', label: 'Washroom A-02', nearGateId: 'GATE_NORTH', anchor: { x: 240, y: 420 } },
];

export const DEMO_VENDING: readonly DemoVendingNode[] = [
  { id: 'VEND-A-01', label: 'Vending A-01', nearGateId: 'GATE_NORTH', anchor: { x: 300, y: 340 } },
  { id: 'VEND-A-02', label: 'Vending A-02', nearGateId: 'GATE_NORTH', anchor: { x: 300, y: 390 } },
];

/** Escalators 131 & 145 near Gate A — status from `facilityStatus` live doc. */
export const DEMO_ESCALATORS: readonly DemoEscalatorNode[] = [
  { id: 'E-131', label: '131', nearGateId: 'GATE_NORTH', anchor: { x: 180, y: 300 } },
  { id: 'E-145', label: '145', nearGateId: 'GATE_NORTH', anchor: { x: 180, y: 410 } },
];

export const DEMO_ELEVATORS: readonly DemoElevatorNode[] = [
  { id: 'EV-41', label: '41', nearGateId: 'GATE_NORTH', anchor: { x: 220, y: 260 } },
  { id: 'EV-43', label: '43', nearGateId: 'GATE_NORTH', anchor: { x: 280, y: 260 } },
  { id: 'EV-56', label: '56', nearGateId: 'GATE_NORTH', anchor: { x: 340, y: 260 } },
];

/** Bowl tiers for seat highlight — y extents in SVG space (top = upper L5). */
export const DEMO_SEAT_TIER_BANDS: readonly { tier: 1 | 2 | 3 | 4 | 5; y0: number; y1: number }[] = [
  { tier: 5, y0: 40, y1: 100 },
  { tier: 4, y0: 102, y1: 140 },
  { tier: 3, y0: 142, y1: 178 },
  { tier: 2, y0: 180, y1: 214 },
  { tier: 1, y0: 216, y1: 248 },
];

export function getGateById(id: DemoGateZone['id'] | string | null | undefined): DemoGateZone | undefined {
  if (!id) return undefined;
  return DEMO_GATES.find((g) => g.id === id);
}
