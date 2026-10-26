// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, startTestServer } from './test/startTestServer.js';
import { validateReport } from '../shared/reports.js';
import { CHECKLIST } from '../shared/checklist.js';
import { MODULES } from './modules/index.js';

describe('feature modules', () => {
  let api;
  let client;

  beforeAll(async () => {
    api = await startTestServer();
    client = createClient(api.baseUrl);
    await client.request('POST', '/api/auth/register', { name: 'Thandi', email: 'thandi@example.com', password: 'password123' });
  });

  afterAll(() => api.close());

  it('lists the modules that are switched on', async () => {
    const { body } = await client.request('GET', '/api/features');
    expect(body.on).toEqual(['alerts', 'community', 'events', 'reactions', 'services', 'eco', 'wallet', 'impact', 'notifications']);
  });

  it.each([
    ['/api/community/pins', 'pins'],
    ['/api/community/updates', 'updates'],
    ['/api/services/status', 'services'],
  ])('GET %s answers with sample data', async (path, key) => {
    const { status, body } = await client.request('GET', path);
    expect(status).toBe(200);
    expect(body.sample).toBe(true);
    expect(body[key]).toBeTruthy();
  });

  it('works out a footprint on the server', async () => {
    const { status, body } = await client.request('POST', '/api/eco/footprint', { kwhPerMonth: 0, carKmPerWeek: 0, busKmPerWeek: 0, diet: 'vegan' });
    expect(status).toBe(200);
    expect(body.total).toBeCloseTo(1.1);
  });

  it('saves a report for a logged-in user and shows it on the map', async () => {
    const created = await client.request('POST', '/api/community/reports', {
      category: 'water',
      description: 'Burst pipe on the corner',
      lat: -26.2,
      lon: 28.05,
    });
    expect(created.status).toBe(201);
    expect(created.body.report).toMatchObject({ category: 'water', status: 'received' });

    const mine = await client.request('GET', '/api/community/reports/mine');
    expect(mine.body.reports).toHaveLength(1);
    const pins = await client.request('GET', '/api/community/pins');
    expect(pins.body.pins.some((pin) => pin.detail === 'Burst pipe on the corner')).toBe(true);
  });

  it('rounds report pins to about 100 m so nobody\'s house shows', async () => {
    const created = await client.request('POST', '/api/community/reports', {
      category: 'roads', description: 'Pothole outside the shop', lat: -26.123456, lon: 28.987654,
    });
    expect(created.body.report).toMatchObject({ lat: -26.123, lon: 28.988 });
  });

  it('rejects a report with no category', async () => {
    const res = await client.request('POST', '/api/community/reports', { description: 'Something' });
    expect(res.status).toBe(400);
  });

  it.each([
    ['POST', '/api/community/reports'],
    ['GET', '/api/community/reports/mine'],
    ['GET', '/api/eco/water/logs'],
    ['GET', '/api/impact/me'],
  ])('%s %s needs a login', async (method, path) => {
    const res = await createClient(api.baseUrl).request(method, path, method === 'POST' ? {} : undefined);
    expect(res.status).toBe(401);
  });

  it('keeps water logs per user', async () => {
    const saved = await client.request('POST', '/api/eco/water/logs', { litres: 45, use: 'shower', date: '2026-10-25' });
    expect(saved.status).toBe(201);
    expect((await client.request('POST', '/api/eco/water/logs', { litres: -1, date: '2026-10-25' })).status).toBe(400);
    expect((await client.request('GET', '/api/eco/water/logs')).body.logs).toHaveLength(1);
  });

  it('works out impact from what was saved', async () => {
    // So far: one water day under the goal (20 points) and two reports (5 each), from the tests above.
    const before = (await client.request('GET', '/api/impact/me')).body;
    expect(before).toMatchObject({ points: 30, level: 1, title: 'Seedling', co2Kg: 0 });

    await client.request('POST', '/api/wallet/logs', { id: 'log-1', actionId: 'recycle-bag', date: '2026-10-25' });
    await client.request('PUT', '/api/alerts/checklist', { value: CHECKLIST.map((item) => item.id) });
    await client.request('PUT', '/api/eco/footprint/mine', { value: { answers: { diet: 'vegan' } } });

    const after = (await client.request('GET', '/api/impact/me')).body;
    expect(after.points).toBe(30 + 10 + 50 + 100);
    expect(after.co2Kg).toBe(1);
    expect(after.badges.find((b) => b.id === 'prepared').unlocked).toBe(true);
    expect(after.badges.find((b) => b.id === 'recycling-champ').have).toBe(1);
  });

  it('saves the recycling day per member', async () => {
    expect((await client.request('GET', '/api/eco/prefs/recyclingDay')).body).toEqual({ value: null });
    expect((await client.request('PUT', '/api/eco/prefs/recyclingDay', { value: 5 })).body).toEqual({ value: 5 });
    expect((await client.request('GET', '/api/eco/prefs/recyclingDay')).body).toEqual({ value: 5 });
    expect((await client.request('PUT', '/api/eco/prefs/recyclingDay', { value: 9 })).status).toBe(400);
    expect((await client.request('PUT', '/api/eco/prefs/colour', { value: 1 })).status).toBe(404);
  });

  it('turns bus events into notifications for the bell', async () => {
    // Saving the checklist and footprint (above) unlocked two badges; the reports said thanks.
    const { body } = await client.request('GET', '/api/notifications');
    const titles = body.items.map((n) => n.title);
    expect(titles).toEqual(expect.arrayContaining(['Badge unlocked: Prepared', 'Badge unlocked: Footprint Finder', 'Report received: water']));
    expect(body.items.every((n) => n.forYou)).toBe(true);
    // Saving again announces nothing new.
    await client.request('PUT', '/api/alerts/checklist', { value: CHECKLIST.map((item) => item.id) });
    expect((await client.request('GET', '/api/notifications')).body.items).toHaveLength(body.items.length);
  });

  it('shows visitors only the notifications meant for everyone', async () => {
    const { status, body } = await fetch(`${api.baseUrl}/api/notifications`).then(async (r) => ({ status: r.status, body: await r.json() }));
    expect(status).toBe(200);
    expect(body.items).toEqual([]);
  });
});

describe('event bus wiring', () => {
  // Every event a module says it emits is really emitted in its code, and
  // every event someone listens for is emitted by some module.
  it('matches what the modules declare', async () => {
    const { readFileSync } = await import('node:fs');
    const all = MODULES.map((mod) => ({ mod, code: readFileSync(new URL(`./modules/${mod.name}/index.js`, import.meta.url), 'utf8') }));
    const emitted = new Set(all.flatMap(({ code }) => [...code.matchAll(/bus\.emit\(\s*(?:'([\w.]+)'|[^,]*\? '([\w.]+)' : '([\w.]+)')/g)].flatMap((m) => m.slice(1).filter(Boolean))));
    for (const { mod } of all) {
      for (const name of mod.events.emits) expect(emitted, `${mod.name} emits ${name}`).toContain(name);
      for (const name of mod.events.listens) expect(emitted, `${mod.name} listens for ${name}`).toContain(name);
    }
  });
});

describe('FEATURES_OFF', () => {
  let api;
  beforeAll(async () => {
    api = await startTestServer({ featuresOff: ['community'] });
  });
  afterAll(() => api.close());

  it('turns a module off (its routes 404) and leaves the rest on', async () => {
    expect((await fetch(`${api.baseUrl}/api/community/pins`)).status).toBe(404);
    expect((await fetch(`${api.baseUrl}/api/services/status`)).status).toBe(200);
  });
});

describe('validateReport', () => {
  it.each([
    [{ category: 'roads', description: 'Pothole outside 12 Main Rd' }, null],
    [{ category: 'roads', description: 'hi' }, 'Describe the problem in a few words'],
    [{ category: 'roads', description: 'Pothole here', lat: 'x', lon: 1 }, 'Location must be numbers'],
    [{ category: 'aliens', description: 'Spaceship landed' }, 'Pick a category'],
  ])('%o -> %s', (report, error) => {
    expect(validateReport(report)).toBe(error);
  });
});
