// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestServer } from './test/startTestServer.js';

describe('API', () => {
  let api;

  beforeAll(async () => {
    api = await startTestServer();
  });

  afterAll(() => api.close());

  it('answers 400, not 500, for broken JSON', async () => {
    const res = await fetch(`${api.baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
    expect(res.status).toBe(400);
  });

  it('answers 413 for a body over the size limit', async () => {
    const res = await fetch(`${api.baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'x'.repeat(200_000) }) });
    expect(res.status).toBe(413);
  });

  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${api.baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('answers unknown API routes with a JSON 404', async () => {
    const res = await fetch(`${api.baseUrl}/api/nope`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });

  it('ignores X-Forwarded-For when no proxy is trusted', async () => {
    const res = await fetch(`${api.baseUrl}/api/health/ip`, { headers: { 'X-Forwarded-For': '203.0.113.7' } });
    expect((await res.json()).ip).not.toBe('203.0.113.7');
  });
});

describe('behind one proxy (trustProxy: 1)', () => {
  let api;
  const from = (ip) => ({ 'X-Forwarded-For': ip, 'Content-Type': 'application/json' });

  beforeAll(async () => {
    api = await startTestServer({ trustProxy: 1 });
  });

  afterAll(() => api.close());

  it('sees the visitor IP the proxy passes on', async () => {
    const res = await fetch(`${api.baseUrl}/api/health/ip`, { headers: from('203.0.113.7') });
    expect((await res.json()).ip).toBe('203.0.113.7');
  });

  it('rate limits each visitor separately', async () => {
    const login = (ip) =>
      fetch(`${api.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: from(ip),
        body: JSON.stringify({ email: 'nobody@example.com', password: 'guess' }),
      });
    for (let i = 0; i < 10; i += 1) await login('203.0.113.1');
    expect((await login('203.0.113.1')).status).toBe(429);
    expect((await login('203.0.113.2')).status).toBe(401);
  });
});

describe('serving the built site (staticDir)', () => {
  let api;
  let dist;

  beforeAll(async () => {
    dist = mkdtempSync(join(tmpdir(), 'dist-'));
    mkdirSync(join(dist, 'assets'));
    writeFileSync(join(dist, 'index.html'), '<div id="root"></div>');
    writeFileSync(join(dist, 'assets', 'index-abc123.js'), 'console.log(1)');
    api = await startTestServer({ staticDir: dist });
  });

  afterAll(async () => {
    await api.close();
    rmSync(dist, { recursive: true, force: true });
  });

  it.each(['/', '/dashboard', '/dashboard/news'])('sends index.html for %s', async (path) => {
    const res = await fetch(`${api.baseUrl}${path}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-cache');
    expect(await res.text()).toContain('id="root"');
  });

  it('caches hashed assets for a year', async () => {
    const res = await fetch(`${api.baseUrl}/assets/index-abc123.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('immutable');
  });

  it('still answers the API, and unknown API routes stay JSON', async () => {
    expect((await fetch(`${api.baseUrl}/api/health`)).status).toBe(200);
    const res = await fetch(`${api.baseUrl}/api/nope`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});
