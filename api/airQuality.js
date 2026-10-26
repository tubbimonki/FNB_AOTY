// Air quality from Open-Meteo's free air quality API (no key, same people as the weather).
// Docs: https://open-meteo.com/en/docs/air-quality-api
// Air changes slowly, so one call per place per hour is plenty.
import { createCache } from './cache.js';
import { placeKey } from './weather.js';

const UPSTREAM = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const FRESH_MS = 60 * 60 * 1000;
const STALE_MS = 6 * 60 * 60 * 1000;
const COOLDOWN_MS = 5 * 60 * 1000;

// US AQI bands (what most apps show): https://www.airnow.gov/aqi/aqi-basics/
const BANDS = [
  [50, 'good'],
  [100, 'moderate'],
  [150, 'unhealthy for sensitive groups'],
  [200, 'unhealthy'],
  [Infinity, 'very unhealthy'],
];
export const aqiBand = (aqi) => BANDS.find(([max]) => aqi <= max)[1];

export function createAirQualityService({ fetchImpl = fetch, now = Date.now } = {}) {
  const cache = createCache({ staleMs: STALE_MS, cooldownMs: COOLDOWN_MS, now });

  async function load(lat, lon) {
    const params = new URLSearchParams({ latitude: lat.toFixed(2), longitude: lon.toFixed(2), current: 'us_aqi,pm2_5' });
    const res = await fetchImpl(`${UPSTREAM}?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo air quality answered ${res.status}`);
    const { current } = await res.json();
    if (!Number.isFinite(current?.us_aqi)) throw new Error('No AQI in the answer');
    return { aqi: current.us_aqi, pm25: current.pm2_5 ?? null };
  }

  // -> { aqi, pm25, fetchedAt, stale }, or throws Unavailable
  async function getAir(lat, lon) {
    const entry = await cache.get(placeKey(lat, lon), FRESH_MS, () => load(lat, lon));
    return { ...entry.value, fetchedAt: entry.fetchedAt, stale: entry.stale };
  }

  return { getAir };
}
