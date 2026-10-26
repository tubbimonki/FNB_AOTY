// Nearby clinics, hospitals, libraries, water points, shelters, police and fire
// stations from OpenStreetMap, through the Overpass API (free, no key).
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
// Data (c) OpenStreetMap contributors, ODbL. The page must say so.
import { createCache, Unavailable } from './cache.js';

// Backup when every Overpass server fails: OSM's own search (Nominatim), same data.
// Policy: at most 1 request a second and a User-Agent. https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_TERMS = ['hospital', 'clinic', 'library', 'police', 'fire station', 'community centre'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Public mirrors, tried in order when the main server is busy or blocks us.
const OVERPASS_MIRRORS = [
  DEFAULT_OVERPASS_URL,
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const TRY_TIMEOUT_MS = 25000; // all servers are asked at once; the first good answer wins
const FRESH_MS = 24 * 60 * 60 * 1000; // facilities rarely move: one call per place a day
const STALE_MS = 7 * 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 5 * 60 * 1000;
const RADIUS_M = 3000;
const PER_TYPE = 2; // nearest 2 of each type, so one type can't fill the list
const MAX_RESULTS = 10;
const MAX_MAP = 60; // dots on the map

export { Unavailable as FacilitiesUnavailable };

// Same rounding as weather.js: about 1 km, shared cache, no exact location kept.
const placeKey = (lat, lon) => `${lat.toFixed(2)},${lon.toFixed(2)}`;

// OSM tags -> our facility types. First match wins.
const TYPES = [
  ['hospital', (t) => t.amenity === 'hospital'],
  ['clinic', (t) => t.amenity === 'clinic' || t.amenity === 'doctors' || t.healthcare === 'clinic'],
  ['library', (t) => t.amenity === 'library'],
  ['water', (t) => t.amenity === 'drinking_water' || t.amenity === 'water_point'],
  ['shelter', (t) => t.social_facility === 'shelter' || t.amenity === 'community_centre'],
  ['police', (t) => t.amenity === 'police'],
  ['fire', (t) => t.amenity === 'fire_station'],
];
const LABELS = {
  hospital: 'Hospital', clinic: 'Clinic', library: 'Library', water: 'Drinking water',
  shelter: 'Community hall / shelter', police: 'Police station', fire: 'Fire station',
};

export function overpassQuery(lat, lon) {
  const around = `(around:${RADIUS_M},${lat.toFixed(2)},${lon.toFixed(2)})`;
  // Exact tag matches use Overpass's index, so they are far faster than one regex.
  const amenities = ['hospital', 'clinic', 'doctors', 'library', 'drinking_water', 'water_point', 'community_centre', 'police', 'fire_station'];
  const lines = [
    ...amenities.map((a) => `  nw["amenity"="${a}"]${around};`),
    `  nw["social_facility"="shelter"]${around};`,
  ];
  return `[out:json][timeout:25];\n(\n${lines.join('\n')}\n);\nout tags center 150;`;
}

// Straight-line distance in km (haversine).
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Overpass elements -> every place found, nearest first (the map shows these).
function toPlaces(raw, from) {
  return (raw.elements ?? [])
    .map((el) => {
      const tags = el.tags ?? {};
      const type = TYPES.find(([, match]) => match(tags))?.[0];
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!type || lat == null || lon == null) return null;
      return {
        id: `${el.type}/${el.id}`,
        type,
        name: tags.name || LABELS[type],
        detail: tags.opening_hours ? `${LABELS[type]}, ${tags.opening_hours}` : LABELS[type],
        distanceKm: Math.round(distanceKm(from, { lat, lon }) * 10) / 10,
        lat: Math.round(lat * 1e5) / 1e5,
        lon: Math.round(lon * 1e5) / 1e5,
        url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_MAP);
}

// The short list for the Services page: nearest 2 of each type, 10 at most.
function pickNearest(places) {
  const seen = {};
  return places.filter((f) => (seen[f.type] = (seen[f.type] ?? 0) + 1) <= PER_TYPE).slice(0, MAX_RESULTS);
}

export const toFacilities = (raw, from) => pickNearest(toPlaces(raw, from));

// Nominatim results -> the same element shape Overpass uses, so toFacilities reads both.
function nominatimToElements(results) {
  return results
    .filter((r) => r.osm_type && r.osm_id && r.category && r.type)
    .map((r) => ({
      type: r.osm_type,
      id: r.osm_id,
      lat: Number(r.lat),
      lon: Number(r.lon),
      tags: { [r.category]: r.type, ...(r.name && { name: r.name }) },
    }));
}

// url: one server, or a list tried in order (OVERPASS_URL in .env sets the first).
// pauseMs: Nominatim allows 1 request a second (tests pass 0).
export function createFacilitiesService({ url = OVERPASS_MIRRORS, fetchImpl = fetch, now = Date.now, pauseMs = 1100, cacheStore = null } = {}) {
  const servers = Array.isArray(url) ? url : [url, ...OVERPASS_MIRRORS.filter((m) => m !== url)];
  const cache = createCache({ staleMs: STALE_MS, cooldownMs: COOLDOWN_MS, now, store: cacheStore, name: 'facilities' });

  async function askServer(server, lat, lon) {
    const res = await fetchImpl(server, {
      method: 'POST',
      // Overpass asks apps to say who they are.
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Eco5-FNB-AOTY-demo/1.0', Accept: 'application/json' },
      body: new URLSearchParams({ data: overpassQuery(lat, lon) }).toString(),
      signal: AbortSignal.timeout(TRY_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`answered ${res.status}`);
    const raw = await res.json().catch(() => null);
    if (!raw) throw new Error('answered with something that is not JSON');
    // A busy server answers 200 with a "remark" and no results: that's a failure, not "nothing nearby".
    if (raw.remark && !(raw.elements?.length > 0)) throw new Error(raw.remark.slice(0, 200));
    return raw;
  }

  // Asks every server at once and takes the first good answer (Promise.any),
  // so one slow server can't hold the page. Logs why each failed if all do.
  async function fetchUpstream(lat, lon) {
    const reasons = [];
    try {
      return await Promise.any(
        servers.map((server) =>
          askServer(server, lat, lon).catch((err) => {
            // "fetch failed" hides the real reason (DNS, TLS, firewall) in err.cause.
            reasons.push(`${new URL(server).host}: ${err.message}${err.cause?.code ? ` (${err.cause.code})` : ''}`);
            throw err;
          }),
        ),
      );
    } catch {
      console.error('Overpass failed:', reasons.join(' | '), '-> trying Nominatim');
    }
    try {
      return await fetchNominatim(lat, lon);
    } catch (err) {
      console.error('Nominatim failed:', err.message);
      throw new Error(`${reasons.join(' | ')} | nominatim: ${err.message}`);
    }
  }

  // One search per kind of place inside a box around the point, 1 a second.
  async function fetchNominatim(lat, lon) {
    const d = 0.03; // about 3 km
    const viewbox = [lon - d, lat + d, lon + d, lat - d].map((n) => n.toFixed(2)).join(',');
    const elements = [];
    for (const [i, term] of NOMINATIM_TERMS.entries()) {
      if (i > 0) await sleep(pauseMs);
      const params = new URLSearchParams({ q: term, format: 'jsonv2', limit: '5', bounded: '1', viewbox, layer: 'poi' });
      const res = await fetchImpl(`${NOMINATIM_URL}?${params}`, {
        headers: { 'User-Agent': 'Eco5-FNB-AOTY-demo/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`answered ${res.status}`);
      elements.push(...nominatimToElements(await res.json()));
    }
    return { elements };
  }

  async function getFacilities(lat, lon) {
    const key = placeKey(lat, lon);
    const from = { lat: Number(lat.toFixed(2)), lon: Number(lon.toFixed(2)) };
    const entry = await cache.get(key, FRESH_MS, async () => toPlaces(await fetchUpstream(lat, lon), from));
    return {
      facilities: pickNearest(entry.value),
      places: entry.value,
      source: 'OpenStreetMap',
      fetchedAt: entry.fetchedAt,
      stale: entry.stale,
    };
  }

  return { getFacilities };
}
