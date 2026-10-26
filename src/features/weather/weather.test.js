import { describe, expect, it } from 'vitest';
import { describeWeather, greenTip, weatherAlerts } from './weather';

const day = (overrides) => ({ date: '2026-10-25', code: 1, maxC: 25, minC: 12, rainChance: 0, uvMax: 5, ...overrides });
const current = { tempC: 22, feelsLikeC: 22, humidity: 40, windKph: 5, code: 1, isDay: true };

describe('weather helpers', () => {
  it('names WMO codes, with a moon for clear nights', () => {
    expect(describeWeather(63)).toEqual({ label: 'Rain', icon: '🌧️' });
    expect(describeWeather(0, false).icon).toBe('🌙');
    expect(describeWeather(1234).label).toBe('Unknown');
  });

  it('raises heat, storm and UV alerts from today and tomorrow only', () => {
    const weather = { current, days: [day({ uvMax: 9 }), day({ code: 95, maxC: 33 }), day({ maxC: 40 })] };
    const alerts = weatherAlerts(weather, 'Durban');
    expect(alerts.map((a) => a.id)).toEqual(['wx-heat', 'wx-storm', 'wx-uv']);
    expect(alerts[0]).toMatchObject({ title: 'Heat: up to 33°C', where: 'Durban', kind: 'alert' });
  });

  it('raises nothing on a mild day or without data', () => {
    expect(weatherAlerts({ current, days: [day(), day()] })).toEqual([]);
    expect(weatherAlerts(null)).toEqual([]);
  });

  it('picks a tip that fits the weather', () => {
    expect(greenTip({ current, days: [day({ rainChance: 80 })] })).toMatch(/Rain/);
    expect(greenTip({ current: { ...current, tempC: 31 }, days: [day()] })).toMatch(/fan/);
  });
});
