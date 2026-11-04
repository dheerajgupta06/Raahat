const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Rough city-driving ETA. Replace with OpenRouteService for road-accurate ETAs. */
export function estimateEtaMinutes(distanceKm) {
  if (!Number.isFinite(distanceKm)) return null;
  return Math.max(4, Math.round((distanceKm / 24) * 60 + 3));
}

export function roundKm(km) {
  return Math.round(km * 10) / 10;
}
