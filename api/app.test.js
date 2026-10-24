// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('API', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = createApp().listen(0); // 0 = any free port
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  afterAll(() => server.close());

  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
