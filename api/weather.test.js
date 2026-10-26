// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createWeatherService, placeKey } from './weather.js';
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
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    clock += 61 * 1000;
    await expect(getWeather(1, 1)).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
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
