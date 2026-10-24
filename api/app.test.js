// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestServer } from './test/startTestServer.js';

describe('API', () => {
  let api;

  beforeAll(async () => {
    api = await startTestServer();
  });

  afterAll(() => api.close());

  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${api.baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
