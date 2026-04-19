import { STITCH_VENUE_SVG_FALLBACK } from './stitchVenueSvg';
import { devLog, devWarn } from './debug';

export type FeatureCollectionLike = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: string; coordinates: unknown };
    properties?: Record<string, unknown>;
  }>;
};

export type VenuePolygonSource = 'maps-datasets' | 'geojson-fallback';

export type VenuePolygonResult = {
  geojson: FeatureCollectionLike;
  source: VenuePolygonSource;
  /** Present when Datasets API failed or was not configured — render in Command / Dashboard map shells. */
  svgFallback?: string;
};

function stitchGeoJsonFallback(): FeatureCollectionLike {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-118.2437, 34.0522],
              [-118.243, 34.0522],
              [-118.243, 34.0515],
              [-118.2437, 34.0515],
              [-118.2437, 34.0522],
            ],
          ],
        },
        properties: {
          zone: 'SECTOR NORTH-WEST',
          fillColor: '#FF0000',
          fillOpacity: 0.8,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-118.245, 34.053],
              [-118.244, 34.053],
              [-118.244, 34.052],
              [-118.245, 34.052],
              [-118.245, 34.053],
            ],
          ],
        },
        properties: {
          zone: 'SECTOR SOUTH',
          fillColor: '#0500FF',
          fillOpacity: 0.4,
        },
      },
    ],
  };
}

/**
 * Maps Datasets API (or compatible) + Stitch SVG fallback when fetch fails or URL unset.
 */
export const fetchVenuePolygons = async (venueId: string): Promise<VenuePolygonResult> => {
  const base = import.meta.env.VITE_MAPS_DATASETS_URL as string | undefined;
  if (base) {
    const url = `${base.replace(/\/$/, '')}/${encodeURIComponent(venueId)}`;
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'omit' });
      if (!res.ok) {
        throw new Error(`Maps Datasets HTTP ${res.status}`);
      }
      const geojson = (await res.json()) as FeatureCollectionLike;
      if (geojson?.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        throw new Error('Invalid GeoJSON FeatureCollection');
      }
      devLog(`[Maps SDK] Datasets response for ${venueId}`);
      return { geojson, source: 'maps-datasets' };
    } catch (e) {
      devWarn('[Maps Datasets] Falling back to Stitch SVG + local GeoJSON:', e);
      return {
        geojson: stitchGeoJsonFallback(),
        source: 'geojson-fallback',
        svgFallback: STITCH_VENUE_SVG_FALLBACK,
      };
    }
  }

  devLog(`[Maps SDK] No VITE_MAPS_DATASETS_URL — Stitch fallback for layout: ${venueId}`);
  return {
    geojson: stitchGeoJsonFallback(),
    source: 'geojson-fallback',
    svgFallback: STITCH_VENUE_SVG_FALLBACK,
  };
};

export { STITCH_VENUE_SVG_FALLBACK };
