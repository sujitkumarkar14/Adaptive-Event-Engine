/**
 * Decodes a Google-encoded polyline to [lng, lat] pairs (GeoJSON order) for SVG mapping.
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodeEncodedPolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

export function boundsOfCoordinates(coords: [number, number][]) {
  if (!coords.length) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  }
  let minX = coords[0][0];
  let maxX = coords[0][0];
  let minY = coords[0][1];
  let maxY = coords[0][1];
  for (const [x, y] of coords) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const padX = Math.max((maxX - minX) * 0.08, 0.0001);
  const padY = Math.max((maxY - minY) * 0.08, 0.0001);
  return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
}
