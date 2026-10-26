// Your area's power (and water) status from the EskomSePush API, cached in memory.
// The free key allows 50 calls a day, so every visitor shares one cached answer.
// Docs: https://developer.sepush.co.za/business/3.1/ (header "Token: <key>")
// Three calls, all for your area only (no national stage any more):
//   /schedule?id=<ESKOMSEPUSH_SCHEDULE>  planned outages ("events") for your block
//   /reports?id=<ESKOMSEPUSH_AREA>&category=electricity|water   what neighbours report right now (one call per category)
import { createCache, Unavailable } from './cache.js';

export const DEFAULT_BASE_URL = 'https://developer.sepush.co.za/business/3.1';
const SCHEDULE_FRESH_MS = 2 * 60 * 60 * 1000; // at most 12 calls a day
const REPORTS_FRESH_MS = 2 * 60 * 60 * 1000; // per category: at most 12 calls a day each
const STALE_MS = 12 * 60 * 60 * 1000;
const COOLDOWN_MS = 15 * 60 * 1000;
const TIME_ZONE = 'Africa/Johannesburg';
const OFFICIAL_WATER = 'https://www.ekurhuleni.gov.za/category/press-releases/service-delivery-interruptions/';

export { Unavailable as EskomUnavailable };

// "Mon 18:00" in SA time, whatever time zone the server runs in.
export function formatSlot(iso) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: TIME_ZONE,
  }).format(new Date(iso)).replace(',', '');
}

const timeOnly = (iso) =>
  new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TIME_ZONE }).format(new Date(iso));

// Adds up the off/on reports for one kind ('electricity' or 'water') over the window.
// Returns null when the answer has no reports of that kind.
export function countReports(reports, kind) {
  // Each bucket is { electricity: { off, on } } or, per category, just { off, on }.
  const buckets = (reports?.reports ?? [])
    .map((r) => r[kind] ?? ('off' in r || 'on' in r ? r : null))
    .filter(Boolean);
  if (buckets.length === 0) return null;
  return {
    off: buckets.reduce((sum, b) => sum + (Number(b.off) || 0), 0),
    on: buckets.reduce((sum, b) => sum + (Number(b.on) || 0), 0),
  };
}

const windowText = (reports) => {
  const minutes = Number(reports?.metrics?.window_minutes);
  if (!minutes) return 'recently';
  return minutes % 60 === 0 ? `in the last ${minutes / 60 === 1 ? 'hour' : `${minutes / 60} hours`}` : `in the last ${minutes} min`;
};

// Many "off" reports, and more off than on, means it's really out.
const reportStatus = ({ off, on }) => {
  if (off >= 3 && off > on) return 'outage';
  if (off > 0) return 'intermittent';
  return 'ok';
};

// Latest neighbour messages -> "Latest updates" rows.
const chatUpdates = (reports) =>
  (reports?.chats ?? [])
    .filter((c) => c.body)
    .sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
    .slice(0, 3)
    .map((c, i) => ({
      id: `c${i}`,
      title: c.body.length > 120 ? `${c.body.slice(0, 117)}...` : c.body,
      detail: c.created ? `Neighbour report, ${formatSlot(c.created)}` : 'Neighbour report',
    }));

// schedule: the /schedule answer or null. reports: the /reports answer or null.
// -> the "electricity" shape the Services page uses.
export function toElectricity(schedule, reports, nowMs = Date.now()) {
  const events = (schedule?.events ?? [])
    .filter((e) => Date.parse(e.end) > nowMs)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const active = events.find((e) => Date.parse(e.start) <= nowMs);
  const next = events.find((e) => e !== active);
  const counts = countReports(reports, 'electricity');

  let status = 'ok';
  let message = 'Power is on in your area. No outages planned.';
  if (active) {
    status = 'outage';
    message = `Power is off in your area until ${timeOnly(active.end)}.`;
  } else if (counts && reportStatus(counts) !== 'ok') {
    status = reportStatus(counts);
    message = `Neighbours report power cuts: ${counts.off} off, ${counts.on} on ${windowText(reports)}.`;
  } else if (next) {
    status = 'scheduled';
    message = `Power is on. Next planned outage ${formatSlot(next.start)} to ${timeOnly(next.end)}.`;
  }

  const updates = chatUpdates(reports);
  if (counts && status !== 'intermittent' && status !== 'outage' && counts.off + counts.on > 0) {
    updates.unshift({ id: 'counts', title: `${counts.off} off, ${counts.on} on`, detail: `Power reports from neighbours ${windowText(reports)}` });
  }
  if (!schedule && !reports) {
    updates.push({ id: 'no-area', title: 'Set your area', detail: 'Add ESKOMSEPUSH_AREA and ESKOMSEPUSH_SCHEDULE to .env to see your own area.' });
  }

  return {
    status,
    title: 'Electricity',
    message,
    area: schedule?.name ?? schedule?.info?.name ?? null,
    health: reports?.health?.state ?? null,
    updates,
    schedule: events.slice(0, 5).map((e, i) => ({
      id: `s${i}`,
      when: `${formatSlot(e.start)} to ${timeOnly(e.end)}`,
      what: 'Planned outage',
    })),
  };
}

// The same /reports answer, read for water. null when it has no water reports,
// so the page keeps its demo water data.
export function toWater(reports) {
  const counts = countReports(reports, 'water');
  if (!counts) return null;
  const status = reportStatus(counts);
  const messages = {
    ok: 'No water problems reported in your area.',
    intermittent: `A few neighbours report no water: ${counts.off} off, ${counts.on} on ${windowText(reports)}.`,
    outage: `Water looks off in your area: ${counts.off} off, ${counts.on} on ${windowText(reports)}.`,
  };
  return {
    status,
    title: 'Water supply',
    message: messages[status],
    updates: [{ id: 'official', title: 'Official notices', detail: 'City of Ekurhuleni planned water and power interruptions', href: OFFICIAL_WATER }],
    schedule: [],
  };
}

// fetchImpl and now are passed in so tests can fake the network and the clock.
// With no token the service is switched off and the page keeps its demo data.
export function createEskomService({ token, scheduleId, areaId, baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch, now = Date.now, cacheStore = null } = {}) {
  const cache = createCache({ staleMs: STALE_MS, cooldownMs: COOLDOWN_MS, now, store: cacheStore, name: 'eskom' });

  async function fetchUpstream(path) {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      headers: { Token: token },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`EskomSePush answered ${res.status}: ${(await res.text?.())?.slice(0, 300) ?? ''}`);
    return res.json();
  }

  // One failing call shouldn't hide the other, so each is tried on its own.
  async function tryGet(id, path, freshMs, extra = '') {
    if (!id) return { entry: null };
    const fullPath = `${path}?id=${encodeURIComponent(id)}${extra}`;
    try {
      return { entry: await cache.get(fullPath, freshMs, () => fetchUpstream(fullPath)) };
    } catch (err) {
      console.error(`EskomSePush ${path}:`, err.message);
      return { entry: null, error: err };
    }
  }

  // -> { electricity, water (or null), fetchedAt, stale }
  async function getArea() {
    const [schedule, power, waterReports] = await Promise.all([
      tryGet(scheduleId, '/schedule', SCHEDULE_FRESH_MS),
      tryGet(areaId, '/reports', REPORTS_FRESH_MS, '&category=electricity'),
      tryGet(areaId, '/reports', REPORTS_FRESH_MS, '&category=water'),
    ]);
    const asked = [schedule, power, waterReports].filter((r) => r.entry || r.error);
    if (asked.length > 0 && asked.every((r) => r.error)) throw new Unavailable(asked[0].error.message);

    const got = [schedule.entry, power.entry, waterReports.entry].filter(Boolean);
    const meta = {
      source: 'EskomSePush',
      fetchedAt: got.length ? Math.min(...got.map((e) => e.fetchedAt)) : now(),
      stale: got.some((e) => e.stale),
    };
    const water = toWater(waterReports.entry?.value ?? null);
    return {
      electricity: { ...toElectricity(schedule.entry?.value ?? null, power.entry?.value ?? null, now()), ...meta },
      water: water && { ...water, ...meta, source: 'EskomSePush neighbour reports' },
    };
  }

  return { enabled: Boolean(token), getArea };
}
