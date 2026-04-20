import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchVenuePolygons } from '../maps';

describe('fetchVenuePolygons', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns fallback FeatureCollection with two zones when Datasets URL is unset', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await fetchVenuePolygons('venue-1');
    expect(result.source).toBe('geojson-fallback');
    expect(result.geojson.type).toBe('FeatureCollection');
    expect(result.geojson.features).toHaveLength(2);
    expect(result.geojson.features[0].properties?.zone).toContain('NORTH');
    expect(result.svgFallback).toBeDefined();
    expect(result.svgFallback).toContain('<svg');
    log.mockRestore();
  });

  it('returns maps-datasets GeoJSON when VITE_MAPS_DATASETS_URL is set and fetch succeeds', async () => {
    vi.stubEnv('VITE_MAPS_DATASETS_URL', 'https://datasets.example.com/v1');
    const fc = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Polygon', coordinates: [] as number[][][] },
          properties: { zone: 'A' },
        },
      ],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fc,
    });
    const result = await fetchVenuePolygons('venue-x');
    expect(result.source).toBe('maps-datasets');
    expect(result.geojson.features).toHaveLength(1);
  });

  it('falls back when Datasets HTTP response is not ok', async () => {
    vi.stubEnv('VITE_MAPS_DATASETS_URL', 'https://datasets.example.com/v1');
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const result = await fetchVenuePolygons('venue-y');
    expect(result.source).toBe('geojson-fallback');
  });
});
