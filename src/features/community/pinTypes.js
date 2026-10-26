import { BookOpen, Droplet, Flame, Hospital, House, Megaphone, Siren, Stethoscope, TriangleAlert } from 'lucide-react';

// Pin colours, icons and names, shared by the map, its legend and the lists.
// Icons are Lucide outlines drawn white on the colour (calmer than emoji).
// The facility types (clinic ... fire) match api/facilities.js.
export const PIN_TYPES = {
  hazard: { label: 'Hazard (unverified)', color: '#dc2626', Icon: TriangleAlert },
  report: { label: 'Community report (unverified)', color: '#0ea5e9', Icon: Megaphone },
  hospital: { label: 'Hospital', color: '#be123c', Icon: Hospital },
  clinic: { label: 'Clinic', color: '#059669', Icon: Stethoscope },
  water: { label: 'Water point', color: '#2563eb', Icon: Droplet },
  shelter: { label: 'Hall / shelter', color: '#d97706', Icon: House },
  library: { label: 'Library', color: '#7c3aed', Icon: BookOpen },
  police: { label: 'Police', color: '#1e3a8a', Icon: Siren },
  fire: { label: 'Fire station', color: '#ea580c', Icon: Flame },
  facility: { label: 'Safe facility', color: '#059669', Icon: House },
};
export const pinType = (type) => PIN_TYPES[type] ?? { label: 'Place', color: '#64748b', Icon: House };

// Facilities this close to you are highlighted on the map and in the lists.
export const NEAR_KM = 1.5;
export const isNearby = (km) => Number.isFinite(km) && km <= NEAR_KM;

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

export { distanceKm } from '../../../shared/geo.js';
