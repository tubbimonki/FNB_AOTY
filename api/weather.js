// Weather from Open-Meteo (free, no API key), cached in memory so many
// visitors cost one upstream call per place every 15 minutes.
// Docs: https://open-meteo.com/en/docs

const UPSTREAM = 'https://api.open-meteo.com/v1/forecast';
const FRESH_MS = 15 * 60 * 1000; // serve from cache without asking upstream
const STALE_MS = 6 * 60 * 60 * 1000; // if upstream is down, old data is still better than none
const MAX_PLACES = 200; // cap memory: forget the oldest place past this
const COOLDOWN_MS = 60 * 1000; // after a failure, wait a minute before asking upstream again

// Thrown when upstream fails and there's nothing cached to fall back on.
export class WeatherUnavailable extends Error {}

// Rounding to 2 decimals (about 1 km) means nearby users share a cache entry
// and we never store anyone's exact location.
export const placeKey = (lat, lon) => `${lat.toFixed(2)},${lon.toFixed(2)}`;

function upstreamUrl(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,uv_index_max',
    timezone: 'auto',
    forecast_days: '4',
  });
  return `${UPSTREAM}?${params}`;
}

// Open-Meteo's column-style arrays -> the small shape the frontend uses.
export function toWeather(raw) {
  const { current, daily } = raw;
  return {
    current: {
      tempC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windKph: current.wind_speed_10m,
      code: current.weather_code,
      isDay: current.is_day === 1,
    },
    days: daily.time.map((date, i) => ({
      date,
      code: daily.weather_code[i],
      maxC: daily.temperature_2m_max[i],
      minC: daily.temperature_2m_min[i],
      rainChance: daily.precipitation_probability_max[i],
      uvMax: daily.uv_index_max[i],
      rainMm: daily.precipitation_sum?.[i] ?? null,
      gustKph: daily.wind_gusts_10m_max?.[i] ?? null,
    })),
  };
}

// fetchImpl and now are passed in so tests can fake the network and the clock.
export function createWeatherService({ fetchImpl = fetch, now = Date.now } = {}) {
  const cache = new Map(); // key -> { weather, fetchedAt }
  const inFlight = new Map(); // key -> Promise, so 50 requests at once make 1 upstream call
  const failedAt = new Map(); // key -> time of the last failure

  async function fetchUpstream(key, lat, lon) {
    const res = await fetchImpl(upstreamUrl(lat, lon), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo answered ${res.status}`);
    const entry = { weather: toWeather(await res.json()), fetchedAt: now() };
    cache.delete(key); // re-insert so Map order = oldest first
    cache.set(key, entry);
    if (cache.size > MAX_PLACES) cache.delete(cache.keys().next().value);
    return entry;
  }

  async function getWeather(lat, lon) {
    const key = placeKey(lat, lon);
    const cached = cache.get(key);
    const age = cached ? now() - cached.fetchedAt : Infinity;
    if (age < FRESH_MS) return { ...cached.weather, fetchedAt: cached.fetchedAt, stale: false };

    const coolingDown = now() - (failedAt.get(key) ?? -Infinity) < COOLDOWN_MS;
    if (!coolingDown && !inFlight.has(key)) {
      inFlight.set(key, fetchUpstream(key, lat, lon).finally(() => inFlight.delete(key)));
    }
    try {
      if (!inFlight.has(key)) throw new Error('Open-Meteo failed a moment ago');
      const entry = await inFlight.get(key);
      failedAt.delete(key);
      return { ...entry.weather, fetchedAt: entry.fetchedAt, stale: false };
    } catch (err) {
      if (!coolingDown) failedAt.set(key, now());
      if (failedAt.size > MAX_PLACES) failedAt.delete(failedAt.keys().next().value);
      if (age < STALE_MS) return { ...cached.weather, fetchedAt: cached.fetchedAt, stale: true };
      throw new WeatherUnavailable(err.message);
    }
  }

  return { getWeather };
}
