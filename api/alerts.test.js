// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startTestServer } from './test/startTestServer.js';
import { airAlert, powerAlerts } from './modules/alerts/index.js';
import { createSawsService, parseFeed, provinceFor } from './saws.js';
import { aqiBand } from './airQuality.js';

const stormyDay = { date: '2026-10-26', code: 95, maxC: 24, minC: 14, rainChance: 90, uvMax: 3, rainMm: 40, gustKph: 85 };
const fakeWeather = (days = [stormyDay, stormyDay]) => ({ getWeather: vi.fn(async () => ({ current: {}, days, stale: false })) });
const down = (name) => ({ enabled: true, [name]: vi.fn(async () => { throw new Error('down'); }) });

const feed = `<?xml version="1.0"?><rss><channel>
  <item><title>Orange Level 6 Warning: Disruptive Rain</title><description><![CDATA[Flooding expected over parts of <b>Gauteng</b> &amp; Mpumalanga.]]></description>
    <link>https://caps.weathersa.co.za/a1</link><guid>a1</guid><pubDate>Mon, 26 Oct 2026 04:00:00 GMT</pubDate></item>
  <item><title>Yellow Level 2 Warning: Wind</title><description>Strong winds along the Western Cape coast.</description>
    <link>javascript:alert(1)</link><guid>a2</guid><pubDate>Mon, 26 Oct 2026 04:00:00 GMT</pubDate></item>
</channel></rss>`;

let api;
afterEach(() => api?.close());
const getAlerts = async (options, query = 'lat=-26.1&lon=28.23&place=Kempton%20Park') => {
  api = await startTestServer(options);
  const res = await fetch(`${api.baseUrl}/api/alerts?${query}`);
  return { status: res.status, body: await res.json() };
};

describe('GET /api/alerts', () => {
  it('combines weather, power, air and SAWS, most serious first', async () => {
    const { status, body } = await getAlerts({
      weather: fakeWeather(),
      eskom: { enabled: true, getArea: async () => ({ electricity: { status: 'scheduled', message: 'Next planned outage Mon 18:00 to 20:30.', area: 'Block 14' }, water: null }) },
      airQuality: { getAir: async () => ({ aqi: 120, pm25: 40, stale: false }) },
      saws: createSawsService({ fetchImpl: async () => new Response(feed), now: () => Date.parse('2026-10-26T06:00:00Z') }),
    });
    expect(status).toBe(200);
    expect(body.sample).toBe(false);
    expect(body.sources).toEqual({ weather: 'live', power: 'live', air: 'live', saws: 'live' });
    const ids = body.alerts.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['saws-0', 'wx-storm', 'wx-flood', 'wx-wind', 'power', 'air']));
    expect(body.alerts[0]).toMatchObject({ severity: 'severe', source: 'SA Weather Service', where: 'Gauteng' });
    expect(body.alerts.at(-1).severity).not.toBe('severe');
    expect(body.alerts.find((a) => a.id === 'power')).toMatchObject({ severity: 'warning', where: 'Block 14' });
    expect(body.alerts.find((a) => a.id === 'wx-storm').where).toBe('Kempton Park');
  });

  it('keeps the live sources when one is down', async () => {
    const { body } = await getAlerts({ weather: fakeWeather(), eskom: down('getArea') });
    expect(body.sample).toBe(false);
    expect(body.sources).toMatchObject({ weather: 'live', power: 'unavailable', air: 'off', saws: 'off' });
    expect(body.alerts.some((a) => a.id === 'wx-storm')).toBe(true);
  });

  it('falls back to labelled sample alerts when nothing answers', async () => {
    const { body } = await getAlerts({ weather: { getWeather: async () => { throw new Error('down'); } }, eskom: { enabled: false } });
    expect(body.sample).toBe(true);
    expect(body.alerts.every((a) => a.sample && a.source === 'Sample data')).toBe(true);
  });

  it('rejects a missing place', async () => {
    const { status } = await getAlerts({ weather: fakeWeather() }, 'lat=&lon=28');
    expect(status).toBe(400);
  });
});

describe('alert helpers', () => {
  it('turns area power and water status into alerts', () => {
    expect(powerAlerts({ electricity: { status: 'ok' }, water: null })).toEqual([]);
    const alerts = powerAlerts({ electricity: { status: 'outage', message: 'Off until 20:30.' }, water: { status: 'intermittent', message: 'A few report no water.' } });
    expect(alerts.map((a) => [a.id, a.severity])).toEqual([['power', 'severe'], ['water', 'warning']]);
  });

  it('only warns about air once it is worse than good', () => {
    expect(airAlert({ aqi: 30 }, 'Durban')).toEqual([]);
    expect(airAlert({ aqi: 75, pm25: 20 }, 'Durban')[0]).toMatchObject({ severity: 'info', title: 'Air quality: moderate (AQI 75)' });
    expect(airAlert({ aqi: 180 }, 'Durban')[0].severity).toBe('severe');
    expect(aqiBand(130)).toBe('unhealthy for sensitive groups');
  });

  it('reads the SAWS feed safely and finds the province', () => {
    const items = parseFeed(feed);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ severity: 'severe', link: 'https://caps.weathersa.co.za/a1', body: 'Flooding expected over parts of Gauteng & Mpumalanga.' });
    expect(items[1]).toMatchObject({ severity: 'warning', link: null });
    expect(parseFeed('not xml')).toEqual([]);
    expect(provinceFor(-26.1, 28.23)).toBe('Gauteng');
    expect(provinceFor(-33.9, 18.5)).toBe('Western Cape');
  });

  it('asks SAWS once per 30 minutes', async () => {
    const fetchImpl = vi.fn(async () => new Response(feed));
    const saws = createSawsService({ fetchImpl, now: () => Date.parse('2026-10-26T06:00:00Z') });
    await saws.getWarnings(-26.1, 28.23);
    await saws.getWarnings(-33.9, 18.5);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(createSawsService({ url: 'off' }).enabled).toBe(false);
  });
});

describe('air quality service', () => {
  it('asks Open-Meteo once per place per hour', async () => {
    const { createAirQualityService } = await import('./airQuality.js');
    const fetchImpl = vi.fn(async () => Response.json({ current: { us_aqi: 64, pm2_5: 18.2 } }));
    const air = createAirQualityService({ fetchImpl, now: () => 0 });
    expect(await air.getAir(-26.204, 28.047)).toMatchObject({ aqi: 64, pm25: 18.2, stale: false });
    await air.getAir(-26.201, 28.049);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
