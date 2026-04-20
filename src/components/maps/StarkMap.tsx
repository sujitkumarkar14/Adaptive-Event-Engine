import React, { useMemo } from 'react';
import type { SVGProps } from 'react';
import { decodeEncodedPolyline, boundsOfCoordinates } from '../../lib/polyline';

export type StarkRouteLayerVariant = 'fan' | 'vip' | 'emergency' | 'exit';

export type StarkRouteLayer = {
  encodedPolyline: string;
  variant: StarkRouteLayerVariant;
  /** Gate reroute “smart path” — high-visibility fan stroke. */
  smartAccent?: boolean;
};

type PathSegment = {
  d: string;
  variant: StarkRouteLayerVariant;
  smartAccent?: boolean;
};

type StarkMapProps = {
  encodedPolyline?: string | null;
  layers?: StarkRouteLayer[] | null;
  /** When true, stroke uses high-visibility “smart path” yellow on black (single legacy fan layer). */
  smartPathMode?: boolean;
  /** When set, draw restricted tunnel + holding overlays (Priority Clearance). */
  priorityClearanceActive?: boolean;
  /** Smart reroute: Stark White polygon over congested tunnel; polylines stay Stark Yellow (smart path). */
  smartRerouteActive?: boolean;
  label?: string;
};

function pathDForCoords(
  coords: [number, number][],
  minX: number,
  minY: number,
  sx: number,
  sy: number
): string {
  return coords
    .map(([x, y], i) => {
      const px = (x - minX) * sx;
      const py = 100 - (y - minY) * sy;
      return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
    })
    .join(' ');
}

/**
 * Zero-radius, no-shadow SVG wayfinding — real Routes API polyline only (no Maps JS SDK).
 */
export const StarkMap = ({
  encodedPolyline,
  layers,
  smartPathMode,
  priorityClearanceActive = false,
  smartRerouteActive = false,
  label = 'Walking path preview',
}: StarkMapProps) => {
  const normalizedLayers: StarkRouteLayer[] = useMemo(() => {
    if (layers && layers.length > 0) {
      return layers;
    }
    if (encodedPolyline) {
      return [{ encodedPolyline, variant: 'fan', smartAccent: Boolean(smartPathMode) }];
    }
    return [];
  }, [layers, encodedPolyline, smartPathMode]);

  const { segments, hasGeometry } = useMemo(() => {
    if (normalizedLayers.length === 0) {
      return { segments: [] as PathSegment[], hasGeometry: false };
    }
    const allCoords: [number, number][] = [];
    const perLayer: [number, number][][] = [];
    for (const layer of normalizedLayers) {
      const coords = decodeEncodedPolyline(layer.encodedPolyline);
      perLayer.push(coords);
      if (coords.length >= 2) {
        allCoords.push(...coords);
      }
    }
    if (allCoords.length < 2) {
      return { segments: [] as PathSegment[], hasGeometry: false };
    }
    const { minX, maxX, minY, maxY } = boundsOfCoordinates(allCoords);
    const w = maxX - minX || 0.0001;
    const h = maxY - minY || 0.0001;
    const sx = 100 / w;
    const sy = 100 / h;

    const segments: PathSegment[] = [];
    for (let i = 0; i < normalizedLayers.length; i++) {
      const layer = normalizedLayers[i];
      const coords = perLayer[i];
      if (coords.length < 2) continue;
      const d = pathDForCoords(coords, minX, minY, sx, sy);
      segments.push({ d, variant: layer.variant, smartAccent: layer.smartAccent });
    }
    return { segments, hasGeometry: segments.length > 0 };
  }, [normalizedLayers]);

  const showMapFrame = hasGeometry || priorityClearanceActive || smartRerouteActive;

  if (!showMapFrame) {
    return (
      <div
        className="border-2 border-outline bg-surface-container-highest p-6 text-center text-xs font-bold uppercase tracking-widest text-outline"
        role="img"
        aria-label={label}
      >
        No path geometry yet
      </div>
    );
  }

  const darkStadium = Boolean(priorityClearanceActive);
  const smartRerouteVisual = Boolean(smartRerouteActive) && !priorityClearanceActive;
  const exitHighlight = segments.some((s) => s.variant === 'exit');
  const bg =
    darkStadium
      ? '#0a0a0c'
      : smartRerouteVisual || segments.some((s) => s.smartAccent) || exitHighlight
        ? '#000000'
        : '#faf9fd';

  return (
    <div
      className="border-2 border-black overflow-hidden"
      style={{ borderRadius: 0 }}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-48 block"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden={false}
      >
        <title>{label}</title>
        <defs>
          <style>
            {`
              @keyframes stark-pulse {
                0%, 100% { stroke-opacity: 1; }
                50% { stroke-opacity: 0.35; }
              }
              .stark-emergency-pulse {
                animation: stark-pulse 1.1s ease-in-out infinite;
              }
            `}
          </style>
        </defs>
        <rect width="100" height="100" fill={bg} />

        {smartRerouteVisual ? (
          <>
            {/* Congested tunnel / restricted segment — Stark White overlay (smart path polyline stays yellow on top). */}
            <rect
              x="12"
              y="42"
              width="38"
              height="18"
              fill="#ffffff"
              fillOpacity={0.94}
              stroke="#ffffff"
              strokeWidth={0.5}
            />
            <text x="14" y="40" fill="#000000" fontSize="3.8" fontWeight="bold" fontFamily="system-ui,sans-serif">
              CONGESTED — AVOID
            </text>
          </>
        ) : null}

        {priorityClearanceActive ? (
          <>
            {/* Restricted tunnel — grayed */}
            <rect x="12" y="42" width="38" height="18" fill="rgba(120,120,130,0.55)" stroke="rgba(80,80,90,0.9)" strokeWidth={0.6} />
            {/* Temporary holding / inner concourse */}
            <rect
              x="54"
              y="28"
              width="38"
              height="44"
              fill="rgba(30,200,120,0.12)"
              stroke="rgba(60,220,140,0.85)"
              strokeWidth={0.8}
              strokeDasharray="2 2"
            />
            <text x="14" y="40" fill="rgba(220,220,230,0.85)" fontSize="4" fontWeight="bold" fontFamily="system-ui,sans-serif">
              RESTRICTED
            </text>
            <text x="56" y="26" fill="rgba(100,240,160,0.95)" fontSize="3.6" fontWeight="bold" fontFamily="system-ui,sans-serif">
              HOLDING
            </text>
          </>
        ) : null}

        {segments.map((seg, i) => {
          const isFan = seg.variant === 'fan';
          const isVip = seg.variant === 'vip';
          const isEm = seg.variant === 'emergency';
          const isExit = seg.variant === 'exit';

          let stroke = '#1a73e8';
          let strokeW = 2.6;
          let extra: Pick<SVGProps<SVGPathElement>, 'strokeDasharray' | 'className'> = {};

          if (isFan && seg.smartAccent) {
            stroke = '#FFCC00';
            strokeW = 3.5;
          } else if (isFan && darkStadium) {
            stroke = '#8ab4f8';
            strokeW = 2.2;
          } else if (isVip) {
            stroke = '#E6C200';
            strokeW = 3.2;
          } else if (isEm) {
            stroke = '#ff2d20';
            strokeW = 3.2;
            extra = {
              strokeDasharray: '4 3',
              className: 'stark-emergency-pulse',
            };
          } else if (isExit) {
            stroke = '#00E5FF';
            strokeW = 3.6;
            extra = { strokeDasharray: '1 0' };
          }

          return (
            <path
              key={`${i}-${seg.variant}`}
              d={seg.d}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeW}
              strokeLinecap="square"
              strokeLinejoin="miter"
              {...extra}
            />
          );
        })}
      </svg>
    </div>
  );
};
