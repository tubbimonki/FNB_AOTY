// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { countReports, createEskomService, EskomUnavailable, toElectricity, toWater } from './eskom.js';
import { createClient, startTestServer } from './test/startTestServer.js';

// Trimmed copies of EskomSePush v3.1 answers.
const SCHEDULE = {
  name: 'City of Ekurhuleni Block 14',
  events: [
    { start: '2026-10-25T18:00:00+02:00', end: '2026-10-25T20:30:00+02:00', note: 'Stage 2' },
    { start: '2026-10-26T02:00:00+02:00', end: '2026-10-26T04:30:00+02:00', note: 'Stage 2' },
  ],
  schedule: { days: [] },
};
const QUIET = { name: 'City of Ekurhuleni Block 14', events: [], schedule: { days: [] } };
const REPORTS = {
  health: { state: 'CRITICAL' },
  metrics: { current_reports: 15, window_minutes: 60 },
  reports: [
    { start: '2026-10-25T11:00:00+02:00', electricity: { off: 5, on: 1 }, water: { off: 1, on: 2 } },
    { start: '2026-10-25T11:30:00+02:00', electricity: { off: 7, on: 2 }, water: { off: 0, on: 1 } },
  ],
  chats: [
    { body: 'Whole street is dark since 10am', created: '2026-10-25T10:15:00+02:00' },
    { body: 'Power back on Pretoria Rd', created: '2026-10-25T11:40:00+02:00' },
  ],
};
const at = (iso) => Date.parse(iso);
const NOON = at('2026-10-25T12:00:00+02:00');

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

// Fake fetch that answers by path and counts calls.
const fakeUpstream = (schedule = SCHEDULE, reports = REPORTS) =>
  vi.fn(async (url) => json(url.includes('/reports?') ? reports : schedule));

describe('toElectricity', () => {
  it('shows the area status, not a stage', () => {
    const e = toElectricity(SCHEDULE, null, NOON);
    expect(e).toMatchObject({ status: 'scheduled', area: 'City of Ekurhuleni Block 14' });
    expect(e.message).toBe('Power is on. Next planned outage Sun 18:00 to 20:30.');
    expect(e.schedule[0]).toEqual({ id: 's0', when: 'Sun 18:00 to 20:30', what: 'Planned outage' });
    expect(JSON.stringify(e)).not.toMatch(/stage/i);
  });

  it('says the area is off during an event', () => {
    const e = toElectricity(SCHEDULE, null, at('2026-10-25T19:00:00+02:00'));
    expect(e.status).toBe('outage');
    expect(e.message).toBe('Power is off in your area until 20:30.');
  });

  it('uses neighbour reports when nothing is planned', () => {
    const e = toElectricity(QUIET, REPORTS, NOON);
    expect(e.status).toBe('outage');
    expect(e.message).toBe('Neighbours report power cuts: 12 off, 3 on in the last hour.');
    expect(e.health).toBe('CRITICAL');
    expect(e.updates[0].title).toBe('Power back on Pretoria Rd'); // newest chat first
  });

  it('is normal with nothing planned or reported', () => {
    const e = toElectricity(QUIET, { reports: [{ electricity: { off: 0, on: 4 } }] }, NOON);
    expect(e.status).toBe('ok');
    expect(e.message).toBe('Power is on in your area. No outages planned.');
    expect(e.updates[0].title).toBe('0 off, 4 on');
  });

  it('asks for an area when none is set', () => {
    const e = toElectricity(null, null, NOON);
    expect(e.schedule).toEqual([]);
    expect(e.updates.at(-1).title).toBe('Set your area');
  });
});

describe('countReports', () => {
  it('reads per-category buckets that are just { off, on }', () => {
    expect(countReports({ reports: [{ off: 2, on: 1 }, { off: 1, on: 0 }] }, 'water')).toEqual({ off: 3, on: 1 });
  });
});

describe('toWater', () => {
  it('reads water reports from the same answer', () => {
    expect(countReports(REPORTS, 'water')).toEqual({ off: 1, on: 3 });
    const w = toWater(REPORTS);
    expect(w.status).toBe('intermittent');
    expect(w.updates[0].href).toMatch(/ekurhuleni\.gov\.za/);
  });

  it('is null without water reports, so the page keeps demo water', () => {
    expect(toWater({ reports: [{ electricity: { off: 1, on: 0 } }] })).toBeNull();
    expect(toWater(null)).toBeNull();
  });
});

describe('createEskomService', () => {
  it('is off without a token', () => {
    expect(createEskomService().enabled).toBe(false);
  });

  it('sends the token and caches answers to save the daily allowance', async () => {
    let clock = NOON;
    const fetchImpl = fakeUpstream();
    const eskom = createEskomService({ token: 'abc', scheduleId: 'ekurhuleni3-14', areaId: 'za_gt_eku_kemptonpark_gltt', fetchImpl, now: () => clock });

    const first = await eskom.getArea();
    await eskom.getArea();
    expect(fetchImpl).toHaveBeenCalledTimes(3); // /schedule + /reports for power and water, once each
    expect(fetchImpl.mock.calls[0][1].headers).toEqual({ Token: 'abc' });
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining('/schedule?id=ekurhuleni3-14'),
      expect.stringContaining('/reports?id=za_gt_eku_kemptonpark_gltt&category=electricity'),
      expect.stringContaining('/reports?id=za_gt_eku_kemptonpark_gltt&category=water'),
    ]);
    expect(first.electricity.source).toBe('EskomSePush');
    expect(first.water.status).toBe('intermittent');

    clock += 2 * 60 * 60 * 1000 + 1; // everything is stale after two hours
    await eskom.getArea();
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it('never asks for the national stage', async () => {
    const fetchImpl = fakeUpstream();
    await createEskomService({ token: 'abc', scheduleId: 'x', areaId: 'y', fetchImpl }).getArea();
    expect(fetchImpl.mock.calls.some(([url]) => url.includes('/status'))).toBe(false);
  });

  it('shares one upstream call between visitors arriving together', async () => {
    const fetchImpl = fakeUpstream();
    const eskom = createEskomService({ token: 'abc', scheduleId: 'x', fetchImpl });
    await Promise.all([eskom.getArea(), eskom.getArea(), eskom.getArea()]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('keeps the schedule when only the reports fail', async () => {
    const fetchImpl = vi.fn(async (url) => (url.includes('/reports?') ? json({ error: 'nope' }, 404) : json(SCHEDULE)));
    const area = await createEskomService({ token: 'abc', scheduleId: 'x', areaId: 'y', fetchImpl, now: () => NOON }).getArea();
    expect(area.electricity.status).toBe('scheduled');
    expect(area.water).toBeNull();
  });

  it('falls back to the last answer when upstream fails, then gives up', async () => {
    let clock = 0;
    let up = true;
    const fetchImpl = vi.fn(async () => (up ? json(QUIET) : json({ error: 'quota' }, 429)));
    const eskom = createEskomService({ token: 'abc', scheduleId: 'x', fetchImpl, now: () => clock });

    await eskom.getArea();
    up = false;
    clock += 3 * 60 * 60 * 1000;
    expect((await eskom.getArea()).electricity.stale).toBe(true);
    clock += 13 * 60 * 60 * 1000;
    await expect(eskom.getArea()).rejects.toBeInstanceOf(EskomUnavailable);
  });
});

describe('failure cooldown', () => {
  it('waits 15 minutes after a failure before calling again', async () => {
    let clock = 0;
    const fetchImpl = vi.fn(async () => json({ error: 'quota' }, 429));
    const eskom = createEskomService({ token: 'abc', scheduleId: 'x', fetchImpl, now: () => clock });

    for (let i = 0; i < 5; i++) await expect(eskom.getArea()).rejects.toBeInstanceOf(EskomUnavailable);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // 5 visits, 1 call

    clock += 16 * 60 * 1000;
    await expect(eskom.getArea()).rejects.toBeInstanceOf(EskomUnavailable);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('GET /api/services/status with EskomSePush', () => {
  it('uses live electricity and water and keeps the other services', async () => {
    const eskom = createEskomService({ token: 'abc', scheduleId: 'x', areaId: 'y', fetchImpl: fakeUpstream() });
    const api = await startTestServer({ eskom });
    try {
      const { body } = await createClient(api.baseUrl).request('GET', '/api/services/status');
      expect(body.live).toEqual(['electricity', 'water']);
      expect(body.services.electricity).toMatchObject({ source: 'EskomSePush', area: 'City of Ekurhuleni Block 14' });
      expect(body.services.water.source).toBe('EskomSePush neighbour reports');
      expect(body.services.transport.title).toBe('Transport');
    } finally {
      await api.close();
    }
  });

  it('says so when EskomSePush is unreachable', async () => {
    const eskom = { enabled: true, getArea: async () => { throw new EskomUnavailable('down'); } };
    const api = await startTestServer({ eskom });
    try {
      const { body } = await createClient(api.baseUrl).request('GET', '/api/services/status');
      expect(body.services.electricity.status).toBe('unknown');
      expect(body.live).toEqual([]);
    } finally {
      await api.close();
    }
  });
});
