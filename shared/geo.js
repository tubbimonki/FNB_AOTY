// Straight-line distance in km between two { lat, lon } points (haversine formula).
// Shared so the API (facility distances) and the browser (map list, location refresh) agree.
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// About 1 km cells: the cache key for anything asked per place, so nearby
// visitors share one answer and the exact spot is never stored.
export const placeKey = (lat, lon) => `${lat.toFixed(2)},${lon.toFixed(2)}`;
