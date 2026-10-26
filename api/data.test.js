// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCache } from './cache.js';
import { createCacheStore } from './cacheStore.js';
import { openDatabase } from './db.js';
import { users } from './schema.js';
import { createClient, startTestServer, testDatabase } from './test/startTestServer.js';

const register = async (client, name) => {
  await client.request('POST', '/api/auth/register', { name, email: `${name.toLowerCase()}@example.com`, password: 'password123' });
  return client;
};

describe('saved per user in Postgres', () => {
  let api;
  let thandi;
  let sipho;

  beforeAll(async () => {
    api = await startTestServer();
    thandi = await register(createClient(api.baseUrl), 'Thandi');
    sipho = await register(createClient(api.baseUrl), 'Sipho');
  });

  afterAll(() => api.close());

  it('saves Green Wallet logs, and a retry with the same id does nothing', async () => {
    const log = { id: 'a1', actionId: 'cold-wash', date: '2026-10-25' };
    expect((await thandi.request('POST', '/api/wallet/logs', log)).status).toBe(201);
    expect((await thandi.request('POST', '/api/wallet/logs', log)).status).toBe(201);
    expect((await thandi.request('GET', '/api/wallet/logs')).body.logs).toEqual([log]);
  });

  it('checks logs: known action, real date', async () => {
    expect((await thandi.request('POST', '/api/wallet/logs', { id: 'b', actionId: 'fly-to-mars', date: '2026-10-25' })).status).toBe(400);
    expect((await thandi.request('POST', '/api/wallet/logs', { id: 'b', actionId: 'cold-wash', date: '2026-02-31' })).status).toBe(400);
    expect((await thandi.request('POST', '/api/wallet/logs', { id: 'bad id!', actionId: 'cold-wash', date: '2026-10-25' })).status).toBe(400);
    const future = await thandi.request('POST', '/api/wallet/logs', { id: 'c', actionId: 'cold-wash', date: '2099-01-01' });
    expect(future.status).toBe(400);
    expect(future.body.error).toMatch(/no later than today/);
    expect((await thandi.request('POST', '/api/eco/water/logs', { id: 'w', litres: 10, date: '2099-01-01' })).status).toBe(400);
  });

  it('keeps each person\'s logs apart, even with the same id', async () => {
    await sipho.request('POST', '/api/wallet/logs', { id: 'a1', actionId: 'walk-5km', date: '2026-10-24' });
    expect((await sipho.request('GET', '/api/wallet/logs')).body.logs).toEqual([{ id: 'a1', actionId: 'walk-5km', date: '2026-10-24' }]);
    expect((await thandi.request('GET', '/api/wallet/logs')).body.logs[0].actionId).toBe('cold-wash');
  });

  it('syncs offline logs in one go, skipping bad ones and ones it has', async () => {
    const { status, body } = await thandi.request('POST', '/api/wallet/logs/sync', {
      logs: [
        { id: 'a1', actionId: 'cold-wash', date: '2026-10-25' },
        { id: 'a2', actionId: 'no-beef', date: '2026-10-26' },
        { id: 'a3', actionId: 'not-real', date: '2026-10-26' },
      ],
    });
    expect(status).toBe(200);
    expect(body.logs.map((l) => l.id)).toEqual(['a2', 'a1']); // newest first
    expect((await thandi.request('POST', '/api/wallet/logs/sync', { logs: 'nope' })).status).toBe(400);
  });

  it('only deletes your own log', async () => {
    await sipho.request('DELETE', '/api/wallet/logs/a2'); // Thandi's id, Sipho's session
    expect((await thandi.request('GET', '/api/wallet/logs')).body.logs).toHaveLength(2);
    expect((await thandi.request('DELETE', '/api/wallet/logs/a2')).status).toBe(204);
    expect((await thandi.request('GET', '/api/wallet/logs')).body.logs).toHaveLength(1);
  });

  it('syncs and deletes water logs', async () => {
    const { body } = await thandi.request('POST', '/api/eco/water/logs/sync', {
      logs: [{ id: 'w1', litres: 45, use: 'shower', date: '2026-10-25' }, { id: 'w2', litres: 9, use: 'toilet', date: '2026-10-25' }],
    });
    expect(body.logs).toHaveLength(2);
    await thandi.request('DELETE', '/api/eco/water/logs/w1');
    expect((await thandi.request('GET', '/api/eco/water/logs')).body.logs).toEqual([{ id: 'w2', litres: 9, use: 'toilet', date: '2026-10-25' }]);
  });

  it('saves the footprint with a total worked out on the server', async () => {
    expect((await thandi.request('GET', '/api/eco/footprint/mine')).body.value).toBeNull();
    const saved = await thandi.request('PUT', '/api/eco/footprint/mine', { value: { answers: { kwhPerMonth: 0, carKmPerWeek: 0, busKmPerWeek: 0, diet: 'vegan' }, total: 0.001 } });
    expect(saved.body.value.total).toBeCloseTo(1.1); // the client's own total is ignored
    expect((await thandi.request('GET', '/api/eco/footprint/mine')).body.value.answers.diet).toBe('vegan');
    expect((await thandi.request('PUT', '/api/eco/footprint/mine', { value: { answers: 'x' } })).status).toBe(400);
  });

  it('saves checklist ticks and drops unknown ids', async () => {
    const res = await thandi.request('PUT', '/api/alerts/checklist', { value: ['kit', 'kit', 'unicorn'] });
    expect(res.body.value).toEqual(['kit']);
    expect((await thandi.request('GET', '/api/alerts/checklist')).body.value).toEqual(['kit']);
    expect((await sipho.request('GET', '/api/alerts/checklist')).body.value).toEqual([]);
  });

  it.each([
    ['GET', '/api/wallet/logs'],
    ['POST', '/api/wallet/logs/sync'],
    ['GET', '/api/eco/footprint/mine'],
    ['PUT', '/api/alerts/checklist'],
  ])('%s %s needs a login', async (method, path) => {
    expect((await createClient(api.baseUrl).request(method, path, method === 'GET' ? undefined : {})).status).toBe(401);
  });

  it('keeps reports when the app restarts', async () => {
    await thandi.request('POST', '/api/community/reports', { category: 'water', description: 'Burst pipe on 4th Ave' });
    await api.close();
    // A new app on the same database, the way Render restarts with Neon.
    const again = await startTestServer({ db: api.db });
    const client = createClient(again.baseUrl);
    client.cookie = thandi.cookie;
    expect((await client.request('GET', '/api/community/reports/mine')).body.reports[0].description).toBe('Burst pipe on 4th Ave');
    api = again;
  });
});

describe('api_cache table', () => {
  it('lets a new cache (after a restart) answer without calling upstream', async () => {
    const db = await testDatabase();
    const store = createCacheStore(db);
    let calls = 0;
    const load = async () => ({ calls: ++calls });

    const first = createCache({ staleMs: 60_000, cooldownMs: 0, store, name: 'test' });
    expect((await first.get('k', 60_000, load)).value).toEqual({ calls: 1 });

    const second = createCache({ staleMs: 60_000, cooldownMs: 0, store, name: 'test' });
    expect((await second.get('k', 60_000, load)).value).toEqual({ calls: 1 });
    expect(calls).toBe(1);
  });

  it('serves a stale saved answer when upstream is down after a restart', async () => {
    const db = await testDatabase();
    const store = createCacheStore(db);
    let t = Date.now();
    const now = () => t;
    await createCache({ staleMs: 100, cooldownMs: 0, store, name: 'x', now }).get('k', 10, async () => 'old');
    t += 50; // past fresh (10), inside stale (100)
    const after = createCache({ staleMs: 100, cooldownMs: 0, store, name: 'x', now });
    const entry = await after.get('k', 10, async () => {
      throw new Error('down');
    });
    expect(entry).toMatchObject({ value: 'old', stale: true });
  });

  it('lets two servers on one database share an answer instead of both calling upstream', async () => {
    const db = await testDatabase();
    const store = createCacheStore(db);
    let t = Date.now();
    const now = () => t;
    let calls = 0;
    const load = async () => ({ calls: ++calls });
    const pc = createCache({ staleMs: 1000, cooldownMs: 0, store, name: 'eskom', now });
    const render = createCache({ staleMs: 1000, cooldownMs: 0, store, name: 'eskom', now });

    await pc.get('k', 100, load);
    await render.get('k', 100, load); // finds the PC's answer in the table
    expect(calls).toBe(1);

    t += 150; // both are past fresh now
    expect((await render.get('k', 100, load)).value).toEqual({ calls: 2 }); // Render refreshes
    expect((await pc.get('k', 100, load)).value).toEqual({ calls: 2 }); // the PC reuses it
    expect(calls).toBe(2);
  });

  it('never breaks the page when the table fails', async () => {
    const broken = { select: () => { throw new Error('db down'); }, insert: () => { throw new Error('db down'); } };
    const cache = createCache({ staleMs: 100, cooldownMs: 0, store: createCacheStore(broken), name: 'x' });
    expect((await cache.get('k', 10, async () => 'fresh')).value).toBe('fresh');
  });
});

describe('PGlite on disk (no DATABASE_URL)', () => {
  it('keeps data between runs', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pglite-'));
    try {
      const db = await openDatabase({ dir });
      await db.insert(users).values({ email: 'a@example.com', name: 'A', passwordHash: 'x' });
      await db.close();
      const reopened = await openDatabase({ dir });
      expect((await reopened.select().from(users)).map((u) => u.email)).toEqual(['a@example.com']);
      await reopened.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60000);
});
