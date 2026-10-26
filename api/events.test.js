// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, startTestServer } from './test/startTestServer.js';
import { shortName } from './modules/events/index.js';
import { premiumUntil } from './modules/impact/index.js';

// Pretend it's 1 Nov 2026: the September clean-up is over, the rest are coming.
const NOW = new Date('2026-11-01T10:00:00+02:00');

describe('community events', () => {
  let api;
  let thandi;
  let sipho;

  beforeAll(async () => {
    api = await startTestServer({ now: () => NOW });
    thandi = createClient(api.baseUrl);
    sipho = createClient(api.baseUrl);
    await thandi.request('POST', '/api/auth/register', { name: 'Thandi Mokoena', email: 'thandi@example.com', password: 'password123' });
    await sipho.request('POST', '/api/auth/register', { name: 'Sipho', email: 'sipho@example.com', password: 'password123' });
  });

  afterAll(() => api.close());

  it('lists the seeded events, upcoming first and past last', async () => {
    const { status, body } = await createClient(api.baseUrl).request('GET', '/api/events');
    expect(status).toBe(200);
    expect(body.events.length).toBeGreaterThan(5);
    expect(body.sample).toBe(true);
    expect(body.events[0]).toMatchObject({ id: 'clean-c-muizenberg-nov', past: false, going: false, attendeeCount: 23 });
    expect(body.events.at(-1)).toMatchObject({ id: 'trash-bash-sunrise-sep', past: true });
    expect(body.events[0].reward).toEqual({ label: '1200 eco-points', points: 1200, premiumDays: 0 });
  });

  it('shows one event with its attendees', async () => {
    const { status, body } = await createClient(api.baseUrl).request('GET', '/api/events/clean-c-muizenberg-nov');
    expect(status).toBe(200);
    expect(body.event.description.length).toBeGreaterThan(0);
    expect(body.event.attendees.length).toBeGreaterThan(5);
    expect(body.event.url).toBe('https://cleanc.co.za/');
  });

  it('answers 404 for an unknown event', async () => {
    const { status } = await thandi.request('GET', '/api/events/nope');
    expect(status).toBe(404);
  });

  it('needs a login to attend', async () => {
    const { status } = await createClient(api.baseUrl).request('POST', '/api/events/clean-c-muizenberg-nov/attend');
    expect(status).toBe(401);
  });

  it('attending saves the RSVP and the impact module awards the points', async () => {
    const { status, body } = await thandi.request('POST', '/api/events/clean-c-muizenberg-nov/attend');
    expect(status).toBe(201);
    expect(body.event).toMatchObject({ going: true, attendeeCount: 24 });
    expect(body.event.attendees[0]).toBe('You');

    // Twice is harmless, and doesn't double the reward.
    await thandi.request('POST', '/api/events/clean-c-muizenberg-nov/attend');
    const awards = await thandi.request('GET', '/api/impact/awards');
    expect(awards.body).toMatchObject({ points: 1200, premiumUntil: null });
    expect(awards.body.awards).toHaveLength(1);
    expect(awards.body.awards[0].label).toBe('Going to Clean C beach clean-up: Muizenberg');

    const me = await thandi.request('GET', '/api/impact/me');
    expect(me.body.points).toBe(1200);
    expect(me.body.level).toBe(3);
  });

  it('others see a short name, and "going" is per user', async () => {
    const { body } = await sipho.request('GET', '/api/events/clean-c-muizenberg-nov');
    expect(body.event.going).toBe(false);
    expect(body.event.attendees[0]).toBe('Thandi M.');
    const list = await thandi.request('GET', '/api/events');
    expect(list.body.events.find((e) => e.id === 'clean-c-muizenberg-nov').going).toBe(true);
  });

  it('a premium reward sets premiumUntil', async () => {
    await sipho.request('POST', '/api/events/trash-bash-sunset-nov/attend');
    const { body } = await sipho.request('GET', '/api/impact/awards');
    expect(body.points).toBe(0);
    expect(new Date(body.premiumUntil).getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 3600 * 1000);
  });

  it('cancelling removes the RSVP and the reward', async () => {
    const { status, body } = await thandi.request('DELETE', '/api/events/clean-c-muizenberg-nov/attend');
    expect(status).toBe(200);
    expect(body.event).toMatchObject({ going: false, attendeeCount: 23 });
    const awards = await thandi.request('GET', '/api/impact/awards');
    expect(awards.body.points).toBe(0);
  });

  it("can't attend an event that already happened", async () => {
    const { status, body } = await thandi.request('POST', '/api/events/trash-bash-sunrise-sep/attend');
    expect(status).toBe(409);
    expect(body.error).toMatch(/already happened/);
  });

  it('seeding again keeps attendees', async () => {
    await thandi.request('POST', '/api/events/repair-cafe/attend');
    const again = await startTestServer({ db: api.db, now: () => NOW });
    const { body } = await createClient(again.baseUrl).request('GET', '/api/events/repair-cafe');
    await again.close();
    expect(body.event.attendees[0]).toBe('Thandi M.');
  });
});

describe('event helpers', () => {
  it('shortens names', () => {
    expect(shortName('Thandi Mokoena')).toBe('Thandi M.');
    expect(shortName('Sipho')).toBe('Sipho');
  });

  it('premium ends at the latest award', () => {
    const awards = [
      { premiumDays: 7, createdAt: '2026-11-01T00:00:00Z' },
      { premiumDays: 0, createdAt: '2026-12-01T00:00:00Z' },
      { premiumDays: 7, createdAt: '2026-11-03T00:00:00Z' },
    ];
    expect(premiumUntil(awards)).toBe('2026-11-10T00:00:00.000Z');
    expect(premiumUntil([])).toBeNull();
  });
});
