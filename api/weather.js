// Weather from Open-Meteo (free, no API key), cached so many visitors cost
// one upstream call per place every 15 minutes.
// Docs: https://open-meteo.com/en/docs
// Open-Meteo limits calls per IP, and Render's servers share IPs with other
// apps, so it can answer 429 there. Then we ask MET Norway (also free, no key)
// and turn its answer into the same shape.
// Docs: https://api.met.no/weatherapi/locationforecast/2.0/documentation
import { createCache, Unavailable } from './cache.js';

const UPSTREAM = 'https://api.open-meteo.com/v1/forecast';
const BACKUP = 'https://api.met.no/weatherapi/locationforecast/2.0/complete';
// MET Norway refuses requests without a User-Agent that says who we are.
const BACKUP_AGENT = 'Eco5.0-climate-app/1.0 github.com/tubbimonki/FNB_AOTY';
const FRESH_MS = 15 * 60 * 1000; // serve from cache without asking upstream
const STALE_MS = 6 * 60 * 60 * 1000; // if upstream is down, old data is still better than none
const COOLDOWN_MS = 60 * 1000; // after a failure, wait a minute before asking upstream again
const DAYS = 4;

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
    forecast_days: String(DAYS),
  });
  return `${UPSTREAM}?${params}`;
}

// Open-Meteo's column-style arrays -> the small shape the frontend uses.
function toWeather(raw) {
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

// MET Norway symbol names -> WMO codes (what the frontend knows).
const SYMBOLS = {
  clearsky: 0, fair: 1, partlycloudy: 2, cloudy: 3, fog: 45,
  lightrain: 61, rain: 63, heavyrain: 65,
  lightrainshowers: 80, rainshowers: 81, heavyrainshowers: 82,
  lightsleet: 66, sleet: 67, heavysleet: 67,
  lightsleetshowers: 85, sleetshowers: 85, heavysleetshowers: 86,
  lightsnow: 71, snow: 73, heavysnow: 75,
  lightsnowshowers: 85, snowshowers: 85, heavysnowshowers: 86,
};
export function symbolToCode(symbol = '') {
  const name = symbol.replace(/_(day|night|polartwilight)$/, '');
  if (name.includes('thunder')) return 95;
  return SYMBOLS[name] ?? 3;
}

const max = (list) => (list.length ? Math.max(...list) : null);
const min = (list) => (list.length ? Math.min(...list) : null);
const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

// MET Norway's list of hourly (later 6-hourly) points -> the same shape as toWeather.
// Times are UTC; days are split by local time, guessed from the longitude
// (South Africa: 28°E -> UTC+2).
export function fromMetNo(raw, lon) {
  const offsetMs = Math.round(lon / 15) * 60 * 60 * 1000;
  const points = raw.properties.timeseries.map((t) => {
    const local = new Date(Date.parse(t.time) + offsetMs);
    const next = t.data.next_1_hours ?? t.data.next_6_hours ?? {};
    return {
      date: local.toISOString().slice(0, 10),
      hour: local.getUTCHours(),
      now: t.data.instant.details,
      symbol: next.summary?.symbol_code,
      rainMm: next.details?.precipitation_amount,
      rainChance: next.details?.probability_of_precipitation,
    };
  });

  const first = points[0];
  const isDay = first.symbol?.endsWith('_night') ? false : first.symbol?.endsWith('_day') ? true : first.hour >= 6 && first.hour < 18;
  const current = {
    tempC: first.now.air_temperature,
    feelsLikeC: first.now.air_temperature,
    humidity: first.now.relative_humidity,
    windKph: round1(first.now.wind_speed * 3.6),
    code: symbolToCode(first.symbol),
    isDay,
  };

  const byDate = new Map();
  for (const p of points) byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);
  const days = [...byDate].slice(0, DAYS).map(([date, list]) => {
    const pick = (fn) => list.map(fn).filter(Number.isFinite);
    const gust = max(pick((p) => p.now.wind_speed_of_gust));
    return {
      date,
      // The worst weather of the day: higher WMO codes are rougher weather.
      code: max(list.filter((p) => p.symbol).map((p) => symbolToCode(p.symbol))) ?? 3,
      maxC: max(pick((p) => p.now.air_temperature)),
      minC: min(pick((p) => p.now.air_temperature)),
      rainChance: max(pick((p) => p.rainChance)),
      uvMax: max(pick((p) => p.now.ultraviolet_index_clear_sky)),
      rainMm: round1(pick((p) => p.rainMm).reduce((sum, mm) => sum + mm, 0)),
      gustKph: gust == null ? null : round1(gust * 3.6),
    };
  });
  return { current, days };
}

// fetchImpl and now are passed in so tests can fake the network and the clock.
// store (api/cacheStore.js) keeps the last good answer in the api_cache table,
// so a restart or an upstream outage still has something to show, and your PC
// and Render (same database) share answers.
export function createWeatherService({ fetchImpl = fetch, now = Date.now, store = null, log = () => {} } = {}) {
  const cache = createCache({ staleMs: STALE_MS, cooldownMs: COOLDOWN_MS, now, store, name: 'weather' });

  async function fromOpenMeteo(lat, lon) {
    const res = await fetchImpl(upstreamUrl(lat, lon), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo answered ${res.status}`);
    return { ...toWeather(await res.json()), source: 'Open-Meteo' };
  }

  async function fromBackup(lat, lon) {
    const params = new URLSearchParams({ lat: lat.toFixed(2), lon: lon.toFixed(2) });
    const res = await fetchImpl(`${BACKUP}?${params}`, { headers: { 'User-Agent': BACKUP_AGENT }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`MET Norway answered ${res.status}`);
    return { ...fromMetNo(await res.json(), lon), source: 'MET Norway' };
  }

  async function load(lat, lon) {
    try {
      return await fromOpenMeteo(lat, lon);
    } catch (first) {
      try {
        const weather = await fromBackup(lat, lon);
        log(`Weather: ${first.message}, used MET Norway instead`);
        return weather;
      } catch (second) {
        throw new Error(`${first.message}; ${second.message}`);
      }
    }
  }

  async function getWeather(lat, lon) {
    try {
      const entry = await cache.get(placeKey(lat, lon), FRESH_MS, () => load(lat, lon));
      return { ...entry.value, fetchedAt: entry.fetchedAt, stale: entry.stale };
    } catch (err) {
      if (err instanceof Unavailable) throw new WeatherUnavailable(err.message);
      throw err;
    }
  }

  return { getWeather };
}
