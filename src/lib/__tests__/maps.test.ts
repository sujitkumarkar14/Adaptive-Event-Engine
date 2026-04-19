import { describe, it, expect, vi } from 'vitest';
import { fetchVenuePolygons } from '../maps';

describe('fetchVenuePolygons', () => {
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
});
