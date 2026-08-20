// utils/geoCircle.ts
// Generates a GeoJSON polygon approximating a circle with a radius in meters.
// Used for geofence visualization on MapLibre (which doesn't support meter-based circle radius natively).

export function createGeoCircle(
  center: [number, number], // [longitude, latitude]
  radiusMeters: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const earthRadius = 6371000; // meters
  const [lng, lat] = center;
  const latRad = (lat * Math.PI) / 180;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
    const dLng = dLat / Math.cos(latRad);
    coords.push([
      lng + dLng * Math.cos(angle),
      lat + dLat * Math.sin(angle),
    ]);
  }

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}
