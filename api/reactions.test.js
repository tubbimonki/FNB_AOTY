// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, startTestServer } from './test/startTestServer.js';
import { openDatabase } from './db.js';
import { seedReactionCounts } from '../shared/reactions.js';
import { eventReactions } from './modules/reactions/schema.js';

const EVENT = 'repair-cafe';
const seed = seedReactionCounts(EVENT);

describe('event reactions', () => {
  let api;
  let thandi;

  beforeAll(async () => {
    api = await startTestServer();
    thandi = createClient(api.baseUrl);
    await thandi.request('POST', '/api/auth/register', { name: 'Thandi', email: 'thandi@example.com', password: 'password123' });
  });

  afterAll(() => api.close());

  it('starts with the demo counts and nothing of mine', async () => {
    const { status, body } = await thandi.request('GET', `/api/reactions/events/${EVENT}`);
    expect(status).toBe(200);
    expect(body).toEqual({ counts: seed, mine: [] });
  });

  it('needs a login to react', async () => {
    const { status } = await createClient(api.baseUrl).request('POST', `/api/reactions/events/${EVENT}`, { reaction: 'heart' });
    expect(status).toBe(401);
  });

  it('refuses an unknown reaction', async () => {
    const { status } = await thandi.request('POST', `/api/reactions/events/${EVENT}`, { reaction: 'angry' });
    expect(status).toBe(400);
  });

  it('a heart counts once, earns 2 points, and a second tap takes both back', async () => {
    const first = await thandi.request('POST', `/api/reactions/events/${EVENT}`, { reaction: 'heart' });
    expect(first.body).toMatchObject({ reacted: true, mine: ['heart'] });
    expect(first.body.counts.heart).toBe(seed.heart + 1);
    expect((await thandi.request('GET', '/api/impact/awards')).body.points).toBe(2);

    const all = await thandi.request('GET', '/api/reactions/events');
    expect(all.body.reactions[EVENT].mine).toEqual(['heart']);

    const second = await thandi.request('POST', `/api/reactions/events/${EVENT}`, { reaction: 'heart' });
    expect(second.body).toMatchObject({ reacted: false, mine: [] });
    expect(second.body.counts.heart).toBe(seed.heart);
    expect((await thandi.request('GET', '/api/impact/awards')).body.points).toBe(0);
  });

  it('different emojis are separate reactions', async () => {
    await thandi.request('POST', `/api/reactions/events/${EVENT}`, { reaction: 'smile' });
    const { body } = await thandi.request('POST', `/api/reactions/events/${EVENT}`, { reaction: 'seedling' });
    expect(body.mine.sort()).toEqual(['seedling', 'smile']);
  });
});

describe('reactions in a separate database', () => {
  it('writes reactions there and nothing to the main database', async () => {
    const reactionsDb = await openDatabase({ dir: ':memory:' });
    const api = await startTestServer({ reactionsDb });
    const client = createClient(api.baseUrl);
    await client.request('POST', '/api/auth/register', { name: 'Sipho', email: 'sipho@example.com', password: 'password123' });
    await client.request('POST', `/api/reactions/events/${EVENT}`, { reaction: 'clap' });

    expect(await reactionsDb.select().from(eventReactions)).toHaveLength(1);
    expect(await api.db.select().from(eventReactions)).toHaveLength(0);
    // The points still land in the main database.
    expect((await client.request('GET', '/api/impact/awards')).body.points).toBe(2);
    await api.close();
    await reactionsDb.close();
  });
});
