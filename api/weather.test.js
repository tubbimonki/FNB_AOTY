// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createWeatherService, placeKey, symbolToCode } from './weather.js';
import { startTestServer } from './test/startTestServer.js';

// What Open-Meteo sends back, trimmed to two days.
const openMeteo = {
  current: {
    temperature_2m: 24.3,
    apparent_temperature: 25.1,
    relative_humidity_2m: 40,
    weather_code: 1,
    wind_speed_10m: 12.5,
    is_day: 1,
  },
  daily: {
    time: ['2026-10-25', '2026-10-26'],
    weather_code: [1, 95],
    temperature_2m_max: [27, 33],
    temperature_2m_min: [14, 17],
    precipitation_probability_max: [5, 80],
    precipitation_sum: [0, 32.5],
    wind_gusts_10m_max: [20, 65],
    uv_index_max: [9.1, 10.2],
  },
};

// What MET Norway sends back, trimmed to a few points (times in UTC; SA is UTC+2).
const point = (time, details, next) => ({ time, data: { instant: { details }, ...next } });
const metNo = {
  properties: {
    timeseries: [
      point('2026-10-26T08:00:00Z', { air_temperature: 21.4, relative_humidity: 35, wind_speed: 4, wind_speed_of_gust: 9, ultraviolet_index_clear_sky: 6 },
        { next_1_hours: { summary: { symbol_code: 'fair_day' }, details: { precipitation_amount: 0, probability_of_precipitation: 5 } } }),
      point('2026-10-26T13:00:00Z', { air_temperature: 26, relative_humidity: 30, wind_speed: 6, wind_speed_of_gust: 15, ultraviolet_index_clear_sky: 8.2 },
        { next_1_hours: { summary: { symbol_code: 'rainandthunder' }, details: { precipitation_amount: 4.5, probability_of_precipitation: 60 } } }),
      point('2026-10-27T06:00:00Z', { air_temperature: 15, relative_humidity: 60, wind_speed: 2, wind_speed_of_gust: 5, ultraviolet_index_clear_sky: 3 },
        { next_6_hours: { summary: { symbol_code: 'cloudy' }, details: { precipitation_amount: 0, probability_of_precipitation: 10 } } }),
    ],
  },
};

const okFetch = () => vi.fn(async () => Response.json(openMeteo));
const failingFetch = () => vi.fn(async () => new Response('down', { status: 502 }));

describe('weather service', () => {
  it('turns Open-Meteo arrays into one object per day', async () => {
    const { getWeather } = createWeatherService({ fetchImpl: okFetch() });
    const weather = await getWeather(-26.2041, 28.0473);
    expect(weather.current).toEqual({ tempC: 24.3, feelsLikeC: 25.1, humidity: 40, windKph: 12.5, code: 1, isDay: true });
    expect(weather.days[1]).toEqual({ date: '2026-10-26', code: 95, maxC: 33, minC: 17, rainChance: 80, uvMax: 10.2, rainMm: 32.5, gustKph: 65 });
    expect(weather.stale).toBe(false);
  });

  it('asks upstream once per place per 15 minutes, then refreshes', async () => {
    let clock = 0;
    const fetchImpl = okFetch();
    const { getWeather } = createWeatherService({ fetchImpl, now: () => clock });

    await getWeather(-26.2041, 28.0473);
    await getWeather(-26.2049, 28.0471); // rounds to the same place
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    clock += 16 * 60 * 1000;
    await getWeather(-26.2041, 28.0473);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('shares one upstream call between requests that arrive together', async () => {
    const fetchImpl = okFetch();
    const { getWeather } = createWeatherService({ fetchImpl });
    await Promise.all([getWeather(1, 1), getWeather(1, 1), getWeather(1, 1)]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('serves old data marked stale when upstream fails', async () => {
    let clock = 0;
    const fetchImpl = okFetch();
    const { getWeather } = createWeatherService({ fetchImpl, now: () => clock });
    await getWeather(1, 1);

    clock += 60 * 60 * 1000;
    fetchImpl.mockImplementation(failingFetch());
    const weather = await getWeather(1, 1);
    expect(weather.stale).toBe(true);
    expect(weather.current.tempC).toBe(24.3);
  });

  it('waits a minute after a failure before asking upstream again', async () => {
    let clock = 0;
    const fetchImpl = vi.fn(failingFetch());
    const { getWeather } = createWeatherService({ fetchImpl, now: () => clock });
    await expect(getWeather(1, 1)).rejects.toThrow();
    await expect(getWeather(1, 1)).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(2); // Open-Meteo, then the backup
    clock += 61 * 1000;
    await expect(getWeather(1, 1)).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('asks MET Norway when Open-Meteo answers 429', async () => {
    const fetchImpl = vi.fn(async (url) =>
      url.startsWith('https://api.met.no/') ? Response.json(metNo) : new Response('Too many requests', { status: 429 }),
    );
    const log = vi.fn();
    const { getWeather } = createWeatherService({ fetchImpl, log });
    const weather = await getWeather(-26.2, 28.05);
    expect(fetchImpl.mock.calls[1][1].headers['User-Agent']).toMatch(/Eco5\.0/);
    expect(weather.source).toBe('MET Norway');
    expect(weather.stale).toBe(false);
    expect(weather.current).toEqual({ tempC: 21.4, feelsLikeC: 21.4, humidity: 35, windKph: 14.4, code: 1, isDay: true });
    expect(weather.days[0]).toEqual({ date: '2026-10-26', code: 95, maxC: 26, minC: 21.4, rainChance: 60, uvMax: 8.2, rainMm: 4.5, gustKph: 54 });
    expect(weather.days[1].date).toBe('2026-10-27');
    expect(log).toHaveBeenCalledWith('Weather: Open-Meteo answered 429, used MET Norway instead');
  });

  it('keeps the last good answer in the store and uses it after a restart', async () => {
    const rows = new Map();
    const store = { load: async (key) => rows.get(key) ?? null, save: async (key, entry) => rows.set(key, entry) };
    let clock = 0;
    await createWeatherService({ fetchImpl: okFetch(), now: () => clock, store }).getWeather(1, 1);
    expect([...rows.keys()]).toEqual(['weather:1.00,1.00']);

    clock += 60 * 60 * 1000; // a fresh server, upstream down: the table still has an answer
    const weather = await createWeatherService({ fetchImpl: failingFetch(), now: () => clock, store }).getWeather(1, 1);
    expect(weather.stale).toBe(true);
    expect(weather.current.tempC).toBe(24.3);
  });

  it('maps MET Norway symbols to WMO codes', () => {
    expect(symbolToCode('clearsky_night')).toBe(0);
    expect(symbolToCode('heavyrainandthunder')).toBe(95);
    expect(symbolToCode('lightrainshowers_day')).toBe(80);
    expect(symbolToCode('something_new')).toBe(3);
  });

  it('rounds locations to about 1 km', () => {
    expect(placeKey(-26.20412, 28.04731)).toBe('-26.20,28.05');
  });
});

describe('GET /api/weather', () => {
  let api;
  const fetchImpl = okFetch();

  beforeAll(async () => {
    api = await startTestServer({ weather: createWeatherService({ fetchImpl }) });
  });

  afterAll(() => api.close());

  it('returns the weather for a place', async () => {
    const res = await fetch(`${api.baseUrl}/api/weather?lat=-26.2&lon=28.05`);
    expect(res.status).toBe(200);
    expect((await res.json()).days).toHaveLength(2);
  });

  it.each(['', '?lat=abc&lon=1', '?lat=91&lon=0', '?lat=0'])('rejects bad coordinates (%s)', async (query) => {
    const res = await fetch(`${api.baseUrl}/api/weather${query}`);
    expect(res.status).toBe(400);
  });

  it('answers 503 when upstream is down and nothing is cached', async () => {
    const down = await startTestServer({ weather: createWeatherService({ fetchImpl: failingFetch() }) });
    const res = await fetch(`${down.baseUrl}/api/weather?lat=1&lon=1`);
    expect(res.status).toBe(503);
    await down.close();
  });
});
