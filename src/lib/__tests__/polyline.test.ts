import { describe, it, expect } from 'vitest';
import { decodeEncodedPolyline, boundsOfCoordinates } from '../polyline';

describe('polyline', () => {
  it('decodes an encoded polyline to lng/lat pairs', () => {
    const pts = decodeEncodedPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(pts.length).toBeGreaterThan(1);
    expect(pts[0][0]).toBeTypeOf('number');
    expect(pts[0][1]).toBeTypeOf('number');
  });

  it('computes bounds for coordinates', () => {
    const b = boundsOfCoordinates([
      [0, 0],
      [1, 1],
    ]);
    expect(b.minX).toBeLessThanOrEqual(b.maxX);
    expect(b.minY).toBeLessThanOrEqual(b.maxY);
  });

  it('returns default bounds for empty coordinates', () => {
    const b = boundsOfCoordinates([]);
    expect(b).toEqual({ minX: 0, maxX: 1, minY: 0, maxY: 1 });
  });
});
