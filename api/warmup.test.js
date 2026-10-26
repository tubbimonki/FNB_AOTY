// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_WARM_PLACE, parsePlace, startWarmup, warmCaches } from './warmup.js';

const services = () => ({
  weather: { getWeather: vi.fn(async () => ({})) },
  airQuality: { getAir: vi.fn(async () => ({})) },
  eskom: { enabled: true, getArea: vi.fn(async () => ({})) },
  saws: { enabled: true, getWarnings: vi.fn(async () => { throw new Error('fetch failed'); }) },
  facilities: { getFacilities: vi.fn(async () => ({})) },
  news: { getNews: vi.fn(async () => ({})) },
});

describe('warm-up', () => {
  it('asks every source for the warm place, and one failure stops nothing', async () => {
    const s = services();
    const result = await warmCaches({ ...s, place: { lat: -26.1, lon: 28.23 } });
    expect(result.ok).toEqual(['weather', 'air', 'power', 'facilities', 'news']);
    expect(result.failed).toEqual(['saws: fetch failed']);
    expect(s.weather.getWeather).toHaveBeenCalledWith(-26.1, 28.23);
    expect(s.facilities.getFacilities).toHaveBeenCalledWith(-26.1, 28.23);
  });

  it('skips EskomSePush on the timer and anything switched off', async () => {
    const s = services();
    const result = await warmCaches({ ...s, withEskom: false, news: null, saws: { enabled: false } });
    expect(s.eskom.getArea).not.toHaveBeenCalled();
    expect(result.ok).toEqual(['weather', 'air', 'facilities']);
  });

  it('warms at once, then on a timer that never keeps the process alive', async () => {
    vi.useFakeTimers();
    try {
      const s = services();
      const log = vi.fn();
      const stop = startWarmup(s, { everyMs: 1000, log });
      await vi.advanceTimersByTimeAsync(0);
      expect(s.eskom.getArea).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Warm-up: weather, air, power, facilities, news ready'));
      await vi.advanceTimersByTimeAsync(1000);
      expect(s.weather.getWeather).toHaveBeenCalledTimes(2);
      expect(s.eskom.getArea).toHaveBeenCalledTimes(1); // only at start
      stop();
      await vi.advanceTimersByTimeAsync(5000);
      expect(s.weather.getWeather).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reads WARM_PLACE, falling back to Johannesburg', () => {
    expect(parsePlace('-26.1,28.23')).toEqual({ lat: -26.1, lon: 28.23 });
    expect(parsePlace(undefined)).toEqual(DEFAULT_WARM_PLACE);
    expect(parsePlace('nonsense')).toEqual(DEFAULT_WARM_PLACE);
    expect(parsePlace('200,10')).toEqual(DEFAULT_WARM_PLACE);
  });
});
