/**
 * Demo venue facility graph: washrooms, escalators, elevators, and merge rules for Firestore `facilityStatus/live`.
 *
 * **Inputs:** Typed layout nodes from `demoVenueLayout`, partial Firestore payloads via `parseFirestoreFacilityData`.
 * **Complexity:** `mergeFacilityStatus` is **O(keys)** over the three maps; UI helpers are **O(n log n)** for washroom sort.
 *
 * @module demoVenueFacilityModel
 */
import type { DemoEscalatorNode, DemoElevatorNode, DemoGateZone, DemoVendingNode, DemoWashroomNode } from './demoVenueLayout';
import {
  DEMO_ELEVATORS,
  DEMO_ESCALATORS,
  DEMO_GATES,
  DEMO_VENDING,
  DEMO_WASHROOMS,
  getGateById,
} from './demoVenueLayout';

/** Vertical transport: `available` | `reduced` | `jammed`. */
export type VerticalStatus = 'available' | 'reduced' | 'jammed';

export type FacilityStatusDoc = {
  washrooms: Record<string, { occupied: boolean }>;
  escalators: Record<string, VerticalStatus>;
  elevators: Record<string, VerticalStatus>;
};

export const DEFAULT_FACILITY_STATUS: FacilityStatusDoc = {
  washrooms: {
    'WR-A-01': { occupied: false },
    'WR-A-02': { occupied: true },
  },
  escalators: {
    'E-131': 'available',
    'E-145': 'jammed',
  },
  elevators: {
    'EV-41': 'jammed',
    'EV-43': 'available',
    'EV-56': 'available',
  },
};

function cloneDefaults(): FacilityStatusDoc {
  return {
    washrooms: { ...DEFAULT_FACILITY_STATUS.washrooms },
    escalators: { ...DEFAULT_FACILITY_STATUS.escalators },
    elevators: { ...DEFAULT_FACILITY_STATUS.elevators },
  };
}

/** Deep-merge Firestore doc onto defaults so partial updates still work. */
export function mergeFacilityStatus(
  remote: Partial<FacilityStatusDoc> | null | undefined
): FacilityStatusDoc {
  const base = cloneDefaults();
  if (!remote) return base;
  if (remote.washrooms) {
    for (const [k, v] of Object.entries(remote.washrooms)) {
      if (v && typeof v === 'object' && typeof v.occupied === 'boolean') {
        base.washrooms[k] = { occupied: v.occupied };
      }
    }
  }
  if (remote.escalators) {
    for (const [k, v] of Object.entries(remote.escalators)) {
      if (v === 'available' || v === 'reduced' || v === 'jammed') {
        base.escalators[k] = v;
      }
    }
  }
  if (remote.elevators) {
    for (const [k, v] of Object.entries(remote.elevators)) {
      if (v === 'available' || v === 'reduced' || v === 'jammed') {
        base.elevators[k] = v;
      }
    }
  }
  return base;
}

export function washroomVacant(status: FacilityStatusDoc, id: string): boolean {
  const o = status.washrooms[id]?.occupied;
  return o !== true;
}

export function verticalStatusLabel(s: VerticalStatus): string {
  switch (s) {
    case 'available':
      return 'Available';
    case 'reduced':
      return 'Reduced capacity';
    case 'jammed':
      return 'Jammed / avoid';
    default:
      return 'Unknown';
  }
}

export function verticalIsBlocked(s: VerticalStatus): boolean {
  return s === 'jammed';
}

/** Tailwind tone classes for status text in attendee UI (consistent across lists). */
export function facilityStatusToneClass(status: VerticalStatus): string {
  if (status === 'jammed') return 'text-error';
  if (status === 'reduced') return 'text-tertiary';
  return 'text-secondary';
}

export type AmenityNearGatePack = {
  gate: DemoGateZone;
  washrooms: Array<{ node: DemoWashroomNode; occupied: boolean; vacant: boolean }>;
  vending: DemoVendingNode[];
  escalators: Array<{ node: DemoEscalatorNode; status: VerticalStatus }>;
  elevators: Array<{ node: DemoElevatorNode; status: VerticalStatus }>;
};

export function packAmenitiesNearGate(
  gateId: DemoGateZone['id'],
  status: FacilityStatusDoc
): AmenityNearGatePack | null {
  const gate = getGateById(gateId);
  if (!gate) return null;

  const washrooms = DEMO_WASHROOMS.filter((w) => w.nearGateId === gateId).map((node) => {
    const occupied = status.washrooms[node.id]?.occupied === true;
    return { node, occupied, vacant: !occupied };
  });

  const vending = DEMO_VENDING.filter((v) => v.nearGateId === gateId);

  const escalators = DEMO_ESCALATORS.filter((e) => e.nearGateId === gateId).map((node) => ({
    node,
    status: status.escalators[node.id] ?? 'available',
  }));

  const elevators = DEMO_ELEVATORS.filter((e) => e.nearGateId === gateId).map((node) => ({
    node,
    status: status.elevators[node.id] ?? 'available',
  }));

  return { gate, washrooms, vending, escalators, elevators };
}

/** Prefer vacant washrooms first, then by id. */
export function sortWashroomsForUi(
  rows: AmenityNearGatePack['washrooms']
): AmenityNearGatePack['washrooms'] {
  return [...rows].sort((a, b) => {
    if (a.vacant !== b.vacant) return a.vacant ? -1 : 1;
    return a.node.id.localeCompare(b.node.id);
  });
}

export function inferNearGateFromStore(
  gatePressureGateId: string | null | undefined,
  currentLocalGate: string | null | undefined
): DemoGateZone['id'] {
  const g = gatePressureGateId || currentLocalGate;
  const hit = DEMO_GATES.find((x) => x.id === g);
  if (hit) return hit.id;
  return 'GATE_NORTH';
}

/** Normalizes Firestore `facilityStatus/live` snapshot data for merge. */
export function parseFirestoreFacilityData(raw: unknown): Partial<FacilityStatusDoc> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const washrooms: FacilityStatusDoc['washrooms'] = {};
  const escalators: FacilityStatusDoc['escalators'] = {};
  const elevators: FacilityStatusDoc['elevators'] = {};
  let hasParsedFields = false;

  if (o.washrooms && typeof o.washrooms === 'object') {
    for (const [k, v] of Object.entries(o.washrooms as Record<string, unknown>)) {
      if (v && typeof v === 'object' && typeof (v as { occupied?: unknown }).occupied === 'boolean') {
        washrooms[k] = { occupied: (v as { occupied: boolean }).occupied };
        hasParsedFields = true;
      }
    }
  }
  if (o.escalators && typeof o.escalators === 'object') {
    for (const [k, v] of Object.entries(o.escalators as Record<string, unknown>)) {
      if (v === 'available' || v === 'reduced' || v === 'jammed') {
        escalators[k] = v;
        hasParsedFields = true;
      }
    }
  }
  if (o.elevators && typeof o.elevators === 'object') {
    for (const [k, v] of Object.entries(o.elevators as Record<string, unknown>)) {
      if (v === 'available' || v === 'reduced' || v === 'jammed') {
        elevators[k] = v;
        hasParsedFields = true;
      }
    }
  }

  if (!hasParsedFields) return null;
  return { washrooms, escalators, elevators };
}

function readEmergencyBroadcastFlag(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return (
    o.emergencyActive === true ||
    o.emergencyBroadcast === true ||
    o.emergency === true ||
    o.facilityEmergency === true
  );
}

/** Normalizes facility doc plus optional operational/emergency flags used for `aria-live` copy. */
export function parseFirestoreFacilityLive(raw: unknown): {
  doc: Partial<FacilityStatusDoc> | null;
  emergencyActive: boolean;
} {
  return {
    doc: parseFirestoreFacilityData(raw),
    emergencyActive: readEmergencyBroadcastFlag(raw),
  };
}

/** Compact, screen-reader-oriented summary of merged facility data (Gate A escalators + optional emergency). */
export function formatFacilityStatusLiveText(
  status: FacilityStatusDoc,
  options?: { emergencyActive?: boolean }
): string {
  const parts: string[] = [];
  if (options?.emergencyActive) {
    parts.push('Venue emergency signal active. Follow staff instructions.');
  }
  const e131 = verticalStatusLabel(status.escalators['E-131'] ?? 'available');
  const e145 = verticalStatusLabel(status.escalators['E-145'] ?? 'available');
  parts.push(`Escalator 131: ${e131}. Escalator 145: ${e145}.`);
  return parts.join(' ');
}
