import React from 'react';
import { parseDemoSeatLevel } from '../../lib/seatSectionMap';

type Props = {
  seatSection: string;
  className?: string;
};

/**
 * Minimal illustrative bowl map — highlights the tier from `seatSection` (demo format `L1-101` … `L5-*`).
 */
export function StadiumSeatFinderSvg({ seatSection, className }: Props) {
  const level = parseDemoSeatLevel(seatSection);
  if (level == null) {
    return (
      <p
        className={`text-xs font-bold text-outline uppercase tracking-widest ${className ?? ''}`}
        role="status"
      >
        Seat map preview uses levels L1–L5 (e.g. L3-124). This ticket label did not match.
      </p>
    );
  }

  const tiers = [5, 4, 3, 2, 1] as const;
  const rowH = 26;
  const left = 24;
  const width = 200;
  const rowStarts = tiers.map((_, i) => 16 + i * rowH);

  return (
    <figure className={className} aria-label={`Seat tier ${level} of 5 — illustrative bowl map`}>
      <figcaption className="mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
        Section map · your tier L{level}
      </figcaption>
      <svg
        role="img"
        viewBox="0 0 240 180"
        className="w-full max-w-md border-2 border-black bg-surface-container-lowest"
      >
        <text x={left} y={12} fontSize={9} fontWeight="900" fontFamily="inherit" fill="currentColor">
          Upper
        </text>
        {tiers.map((tier, i) => {
          const yy = rowStarts[i]!;
          const active = tier === level;
          return (
            <g key={tier}>
              <rect
                x={left}
                y={yy}
                width={width}
                height={rowH - 2}
                fill={active ? '#1A73E8' : '#f4f3f7'}
                stroke="#1a1b1e"
                strokeWidth={2}
              />
              <text
                x={left + 8}
                y={yy + 17}
                fontSize={11}
                fontWeight="900"
                fontFamily="inherit"
                fill={active ? '#ffffff' : '#1a1b1e'}
              >
                L{tier}
                {active ? ' · you' : ''}
              </text>
            </g>
          );
        })}
        <text x={left} y={172} fontSize={9} fontWeight="900" fontFamily="inherit" fill="currentColor">
          Field / pitch
        </text>
      </svg>
    </figure>
  );
}
