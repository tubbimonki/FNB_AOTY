// Pin colours, icons and names, shared by the map, its legend and the list.
// The facility types (clinic ... fire) match api/facilities.js.
export const PIN_TYPES = {
  hazard: { label: 'Hazard (unverified)', color: '#dc2626', icon: '⚠️' },
  report: { label: 'Community report', color: '#0ea5e9', icon: '📣' },
  hospital: { label: 'Hospital', color: '#be123c', icon: '🏥' },
  clinic: { label: 'Clinic', color: '#059669', icon: '🩺' },
  water: { label: 'Water point', color: '#2563eb', icon: '💧' },
  shelter: { label: 'Hall / shelter', color: '#d97706', icon: '🏠' },
  library: { label: 'Library', color: '#7c3aed', icon: '📚' },
  police: { label: 'Police', color: '#1e3a8a', icon: '🚓' },
  fire: { label: 'Fire station', color: '#ea580c', icon: '🚒' },
  facility: { label: 'Safe facility', color: '#059669', icon: '🏠' },
};

export const FACILITY_TYPES = ['hospital', 'clinic', 'water', 'shelter', 'library', 'police', 'fire', 'facility'];

// The filter chips. `types` lists the pin types each one shows.
export const FILTERS = [
  { id: 'all', label: 'All', types: Object.keys(PIN_TYPES) },
  { id: 'hazards', label: 'Hazards', types: ['hazard'] },
  { id: 'facilities', label: 'Facilities', types: FACILITY_TYPES },
  { id: 'reports', label: 'Reports', types: ['report'] },
];

export const filterPins = (pins, filterId) => {
  const filter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];
  return pins.filter((pin) => filter.types.includes(pin.type));
};

// Real places from OpenStreetMap -> map pins. When there are some, they
// replace the sample facility and water pins.
export function withFacilities(pins, places) {
  if (!places?.length) return pins;
  const real = places.map((p) => ({ id: `osm-${p.id}`, type: p.type, title: p.name, detail: p.detail, lat: p.lat, lon: p.lon, url: p.url }));
  return [...pins.filter((pin) => !FACILITY_TYPES.includes(pin.type)), ...real];
}

// Straight-line distance in km between two { lat, lon } points (haversine formula).
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
