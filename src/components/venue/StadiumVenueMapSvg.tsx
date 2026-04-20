import React from 'react';
import type { FacilityStatusDoc, VerticalStatus } from '../../lib/demoVenueFacilityModel';
import {
  DEMO_CORRIDORS,
  DEMO_ELEVATORS,
  DEMO_ESCALATORS,
  DEMO_GATES,
  DEMO_SEAT_TIER_BANDS,
  DEMO_VENDING,
  DEMO_WASHROOMS,
} from '../../lib/demoVenueLayout';

function statusStroke(s: VerticalStatus): string {
  if (s === 'jammed') return '#b71c1c';
  if (s === 'reduced') return '#b45309';
  return '#15803d';
}

type Props = {
  facilityStatus: FacilityStatusDoc;
  /** Highlight L1–L5 when known from ticket section. */
  highlightTier: number | null;
  /** Which gate cluster to emphasize (default North / Gate A). */
  emphasisGateId?: string;
};

/**
 * Full-schematic venue map: corridors, gates, washrooms, vending, escalators, elevators, bowl tiers.
 */
export function StadiumVenueMapSvg({ facilityStatus, highlightTier, emphasisGateId }: Props) {
  const emph = emphasisGateId ?? 'GATE_NORTH';

  return (
    <svg
      viewBox="0 0 1000 700"
      className="w-full h-auto border-2 border-black bg-surface-container-lowest"
      role="img"
      aria-label="Stadium schematic with corridors, gates, washrooms, vending, escalators, elevators, and seat tiers"
    >
      <rect x={0} y={0} width={1000} height={700} fill="#faf9fd" />

        {/* Seat bowl tiers */}
        <text x={24} y={28} fontSize={14} fontWeight={900} fill="#1a1b1e">
          Seating bowl (illustrative)
        </text>
        {DEMO_SEAT_TIER_BANDS.map(({ tier, y0, y1 }) => {
          const active = highlightTier === tier;
          return (
            <g key={tier}>
              <rect
                x={320}
                y={y0}
                width={360}
                height={y1 - y0}
                fill={active ? '#c7d8fc' : '#e8eaf0'}
                stroke="#1a1b1e"
                strokeWidth={active ? 3 : 1}
              />
              <text x={330} y={(y0 + y1) / 2 + 5} fontSize={12} fontWeight={900} fill="#1a1b1e">
                L{tier}
                {active ? ' · your tier' : ''}
              </text>
            </g>
          );
        })}

        {/* Pitch */}
        <ellipse cx={500} cy={560} rx={220} ry={90} fill="#c8e6c9" stroke="#1a1b1e" strokeWidth={2} />
        <text x={430} y={565} fontSize={12} fontWeight={900} fill="#1a1b1e">
          Field
        </text>

        {/* Corridors */}
        {DEMO_CORRIDORS.map((c) => (
          <path
            key={c.id}
            d={c.d}
            fill="none"
            stroke="#5c6370"
            strokeWidth={8}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
        ))}

        {/* Gates */}
        {DEMO_GATES.map((g) => {
          const emphasis = g.id === emph;
          return (
            <g key={g.id}>
              <circle
                cx={g.anchor.x}
                cy={g.anchor.y}
                r={emphasis ? 22 : 14}
                fill={emphasis ? '#1A73E8' : '#dfe3ea'}
                stroke="#000"
                strokeWidth={2}
              />
              <text
                x={g.anchor.x}
                y={g.anchor.y + 5}
                fontSize={11}
                fontWeight={900}
                fill={emphasis ? '#fff' : '#1a1b1e'}
                textAnchor="middle"
              >
                {g.displayName.replace(/\s*\(.*\)\s*$/, '')}
              </text>
            </g>
          );
        })}

        {/* Washrooms */}
        {DEMO_WASHROOMS.map((w) => {
          const occ = facilityStatus.washrooms[w.id]?.occupied === true;
          return (
            <g key={w.id}>
              <circle
                cx={w.anchor.x}
                cy={w.anchor.y}
                r={12}
                fill={occ ? '#fecaca' : '#bbf7d0'}
                stroke="#000"
                strokeWidth={2}
              />
              <text x={w.anchor.x - 3} y={w.anchor.y + 4} fontSize={10} fontWeight={900} fill="#000">
                WC
              </text>
              <text x={w.anchor.x + 18} y={w.anchor.y + 4} fontSize={9} fontWeight={700} fill="#374151">
                {occ ? 'Occupied' : 'Vacant'}
              </text>
            </g>
          );
        })}

        {/* Vending */}
        {DEMO_VENDING.map((v) => (
          <g key={v.id}>
            <rect
              x={v.anchor.x - 10}
              y={v.anchor.y - 10}
              width={20}
              height={20}
              fill="#fde68a"
              stroke="#000"
              strokeWidth={2}
              transform={`rotate(45 ${v.anchor.x} ${v.anchor.y})`}
            />
            <text x={v.anchor.x + 14} y={v.anchor.y + 4} fontSize={9} fontWeight={700} fill="#374151">
              Vend
            </text>
          </g>
        ))}

        {/* Escalators */}
        {DEMO_ESCALATORS.map((e) => {
          const st = facilityStatus.escalators[e.id] ?? 'available';
          return (
            <g key={e.id}>
              <rect
                x={e.anchor.x - 24}
                y={e.anchor.y - 14}
                width={48}
                height={28}
                fill="#f1f5f9"
                stroke={statusStroke(st)}
                strokeWidth={3}
              />
              <text
                x={e.anchor.x}
                y={e.anchor.y + 4}
                fontSize={10}
                fontWeight={900}
                fill="#000"
                textAnchor="middle"
              >
                Esc {e.label}
              </text>
            </g>
          );
        })}

        {/* Elevators */}
        {DEMO_ELEVATORS.map((ev) => {
          const st = facilityStatus.elevators[ev.id] ?? 'available';
          return (
            <g key={ev.id}>
              <rect
                x={ev.anchor.x - 20}
                y={ev.anchor.y - 18}
                width={40}
                height={36}
                fill="#f1f5f9"
                stroke={statusStroke(st)}
                strokeWidth={3}
              />
              <text
                x={ev.anchor.x}
                y={ev.anchor.y + 4}
                fontSize={10}
                fontWeight={900}
                fill="#000"
                textAnchor="middle"
              >
                Lift {ev.label}
              </text>
            </g>
          );
        })}

        <g transform="translate(620 20)">
          <rect x={0} y={0} width={360} height={120} fill="#ffffff" stroke="#000" strokeWidth={2} />
          <text x={12} y={22} fontSize={11} fontWeight={900}>
            Legend
          </text>
          <circle cx={18} cy={42} r={6} fill="#bbf7d0" stroke="#000" />
          <text x={32} y={46} fontSize={9} fontWeight={700}>
            Washroom vacant
          </text>
          <circle cx={18} cy={62} r={6} fill="#fecaca" stroke="#000" />
          <text x={32} y={66} fontSize={9} fontWeight={700}>
            Washroom occupied
          </text>
          <rect x={10} y={78} width={16} height={8} stroke="#15803d" strokeWidth={2} fill="none" />
          <text x={32} y={86} fontSize={9} fontWeight={700}>
            Esc / lift available
          </text>
          <rect x={200} y={34} width={20} height={8} stroke="#b71c1c" strokeWidth={2} fill="none" />
          <text x={228} y={42} fontSize={9} fontWeight={700}>
            Jammed — avoid
          </text>
        </g>
    </svg>
  );
}
