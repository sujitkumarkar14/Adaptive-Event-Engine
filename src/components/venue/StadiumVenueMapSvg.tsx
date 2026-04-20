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
import { STADIUM_VENUE_SVG } from '../../constants/venueSvg';

function statusStroke(s: VerticalStatus): string {
  const { verticalStroke: vs } = STADIUM_VENUE_SVG;
  if (s === 'jammed') return vs.jammed;
  if (s === 'reduced') return vs.reduced;
  return vs.available;
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
 * SVG groups expose `<title>` / `<desc>` and `aria-labelledby` for assistive tech and document outline.
 */
export function StadiumVenueMapSvg({ facilityStatus, highlightTier, emphasisGateId }: Props) {
  const emph = emphasisGateId ?? 'GATE_NORTH';
  const vb = STADIUM_VENUE_SVG;

  return (
    <svg
      viewBox={vb.viewBox}
      className="w-full h-auto border-2 border-black bg-surface-container-lowest"
      role="img"
      aria-label="Stadium schematic with corridors, gates, washrooms, vending, escalators, elevators, and seat tiers"
    >
      <rect x={0} y={0} width={vb.width} height={vb.height} fill={vb.canvasFill} />

      <g id="venue-svg-seat-bowl" aria-labelledby="venue-svg-seat-bowl-title">
        <title id="venue-svg-seat-bowl-title">Seating bowl (illustrative)</title>
        <desc id="venue-svg-seat-bowl-desc">
          Five seating levels L1 through L5 around the pitch; your checked-in tier may be highlighted.
        </desc>
        <text x={24} y={28} fontSize={14} fontWeight={900} fill="#1a1b1e">
          Seating bowl (illustrative)
        </text>
        {DEMO_SEAT_TIER_BANDS.map(({ tier, y0, y1 }) => {
          const active = highlightTier === tier;
          const titleId = `venue-svg-tier-l${tier}-title`;
          return (
            <g key={tier} id={`venue-svg-tier-l${tier}`} aria-labelledby={titleId}>
              <title id={titleId}>{`Seating level L${tier}`}</title>
              <desc id={`venue-svg-tier-l${tier}-desc`}>
                {active
                  ? 'This level matches your ticket section.'
                  : `Illustrative band for level L${tier}.`}
              </desc>
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
      </g>

      <g id="venue-svg-pitch" aria-labelledby="venue-svg-pitch-title">
        <title id="venue-svg-pitch-title">Playing field</title>
        <desc id="venue-svg-pitch-desc">Elliptical pitch area at the center of the schematic.</desc>
        <ellipse cx={500} cy={560} rx={220} ry={90} fill="#c8e6c9" stroke="#1a1b1e" strokeWidth={2} />
        <text x={430} y={565} fontSize={12} fontWeight={900} fill="#1a1b1e">
          Field
        </text>
      </g>

      <g id="venue-svg-corridors" aria-labelledby="venue-svg-corridors-title">
        <title id="venue-svg-corridors-title">Concourse corridors</title>
        <desc id="venue-svg-corridors-desc">Walkways connecting gates, amenities, and vertical transport.</desc>
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
      </g>

      <g id="venue-svg-gates" aria-labelledby="venue-svg-gates-title">
        <title id="venue-svg-gates-title">Entry gates</title>
        <desc id="venue-svg-gates-desc">Gate clusters; emphasis shows the cluster closest to routing pressure or beacon hints.</desc>
        {DEMO_GATES.map((g) => {
          const emphasis = g.id === emph;
          const gid = `venue-svg-gate-${g.id}`;
          return (
            <g key={g.id} id={gid} aria-labelledby={`${gid}-title`}>
              <title id={`${gid}-title`}>{g.displayName}</title>
              <desc id={`${gid}-desc`}>Ingress marker for {g.displayName}.</desc>
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
      </g>

      <g id="venue-svg-washrooms" aria-labelledby="venue-svg-washrooms-title">
        <title id="venue-svg-washrooms-title">Washrooms</title>
        <desc id="venue-svg-washrooms-desc">Restrooms with vacant or occupied status from live facility data.</desc>
        {DEMO_WASHROOMS.map((w) => {
          const occ = facilityStatus.washrooms[w.id]?.occupied === true;
          const wid = `venue-svg-wc-${w.id}`;
          return (
            <g key={w.id} id={wid} aria-labelledby={`${wid}-title`}>
              <title id={`${wid}-title`}>{`Washroom ${w.label}`}</title>
              <desc id={`${wid}-desc`}>{occ ? 'Occupied' : 'Vacant'}.</desc>
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
      </g>

      <g id="venue-svg-vending" aria-labelledby="venue-svg-vending-title">
        <title id="venue-svg-vending-title">Vending</title>
        <desc id="venue-svg-vending-desc">Concourse vending markers near gates.</desc>
        {DEMO_VENDING.map((v) => (
          <g key={v.id} id={`venue-svg-vend-${v.id}`} aria-labelledby={`venue-svg-vend-${v.id}-title`}>
            <title id={`venue-svg-vend-${v.id}-title`}>{`Vending ${v.label}`}</title>
            <desc id={`venue-svg-vend-${v.id}-desc`}>Diamond marker for a vending location.</desc>
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
      </g>

      <g id="venue-svg-escalators" aria-labelledby="venue-svg-escalators-title">
        <title id="venue-svg-escalators-title">Escalators</title>
        <desc id="venue-svg-escalators-desc">Escalator stroke color reflects available, reduced capacity, or jammed.</desc>
        {DEMO_ESCALATORS.map((e) => {
          const st = facilityStatus.escalators[e.id] ?? 'available';
          const eid = `venue-svg-esc-${e.id}`;
          return (
            <g key={e.id} id={eid} aria-labelledby={`${eid}-title`}>
              <title id={`${eid}-title`}>{`Escalator ${e.label}`}</title>
              <desc id={`${eid}-desc`}>Status: {st}.</desc>
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
      </g>

      <g id="venue-svg-elevators" aria-labelledby="venue-svg-elevators-title">
        <title id="venue-svg-elevators-title">Elevators</title>
        <desc id="venue-svg-elevators-desc">Lift boxes with the same status coloring as escalators.</desc>
        {DEMO_ELEVATORS.map((ev) => {
          const st = facilityStatus.elevators[ev.id] ?? 'available';
          const eid = `venue-svg-lift-${ev.id}`;
          return (
            <g key={ev.id} id={eid} aria-labelledby={`${eid}-title`}>
              <title id={`${eid}-title`}>{`Elevator ${ev.label}`}</title>
              <desc id={`${eid}-desc`}>Status: {st}.</desc>
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
      </g>

      <g
        id="venue-svg-legend"
        transform="translate(620 20)"
        aria-labelledby="venue-svg-legend-title"
      >
        <title id="venue-svg-legend-title">Map legend</title>
        <desc id="venue-svg-legend-desc">Color key for washrooms and escalator or lift status.</desc>
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
        <rect x={10} y={78} width={16} height={8} stroke={vb.verticalStroke.available} strokeWidth={2} fill="none" />
        <text x={32} y={86} fontSize={9} fontWeight={700}>
          Esc / lift available
        </text>
        <rect x={200} y={34} width={20} height={8} stroke={vb.verticalStroke.jammed} strokeWidth={2} fill="none" />
        <text x={228} y={42} fontSize={9} fontWeight={700}>
          Jammed — avoid
        </text>
      </g>
    </svg>
  );
}
