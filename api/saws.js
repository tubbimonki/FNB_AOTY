// Official warnings from the South African Weather Service (SAWS).
// SAWS has no JSON API, but it publishes every warning as a CAP alert (the
// international Common Alerting Protocol, CAP 1.2) listed in an RSS feed:
// https://alertingauthority.wmo.int/authorities.php?recId=152
// The real feed (checked against Shella's copy, 26 Oct 2026) holds ~570 items
// back to May 2025, repeats some, and each item is just a title ("Damaging
// Winds"), an impacts list and a link to the CAP file, named by province:
//   http://www.weathersa.co.za/Documents/Warnings/GP_CAP_DamagingWinds_20261019_095710.xml
// So we read only the newest items, open each CAP file for its level, expiry
// and area, and keep warnings that haven't expired and cover the visitor's
// spot (CAP polygon) or their province (file name prefix).
// CAP 1.2 spec: https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html
import { createCache, Unavailable } from './cache.js';

export const DEFAULT_SAWS_URL = 'https://caps.weathersa.co.za/Home/RssFeed';
const FRESH_MS = 30 * 60 * 1000;
const STALE_MS = 6 * 60 * 60 * 1000;
const COOLDOWN_MS = 15 * 60 * 1000;
const NEWEST = 15; // CAP files opened per refresh
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // used when a warning has no expiry time

// File name prefix -> province. The feed has shown EC, FS, GP, KZN and WC so far.
const PROVINCE_CODES = {
  GP: 'Gauteng', WC: 'Western Cape', KZN: 'KwaZulu-Natal', EC: 'Eastern Cape', FS: 'Free State',
  LP: 'Limpopo', MP: 'Mpumalanga', NW: 'North West', NC: 'Northern Cape',
};

export { Unavailable as SawsUnavailable };

// Province capitals, to guess which province a place is in (nearest wins).
const PROVINCES = [
  ['Gauteng', -26.2, 28.05],
  ['Western Cape', -33.92, 18.42],
  ['KwaZulu-Natal', -29.6, 30.38],
  ['Eastern Cape', -32.88, 27.4],
  ['Free State', -29.12, 26.21],
  ['Limpopo', -23.9, 29.45],
  ['Mpumalanga', -25.47, 30.97],
  ['North West', -25.85, 25.64],
  ['Northern Cape', -28.74, 24.76],
];
export const provinceFor = (lat, lon) =>
  PROVINCES.reduce((best, p) => ((p[1] - lat) ** 2 + (p[2] - lon) ** 2 < (best[1] - lat) ** 2 + (best[2] - lon) ** 2 ? p : best))[0];

const decode = (text) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

// Tags may carry a namespace prefix (cap:info), so it is optional here.
const all = (xml, name) => String(xml).match(new RegExp(`<(?:\\w+:)?${name}[\\s>][\\s\\S]*?</(?:\\w+:)?${name}>`, 'gi')) ?? [];
const tag = (xml, name) => {
  const match = String(xml).match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${name}>`, 'i'));
  return match ? decode(match[1]) : '';
};

// Only web links are kept (no javascript: and friends).
const safeLink = (url) => (/^https?:\/\//i.test(url) ? url : null);
// The feed links with http://, and some SAWS hosts only answer on https://, so try that first.
const httpsFirst = (url) => (url.startsWith('http://') ? [url.replace(/^http:/, 'https:'), url] : [url]);

// SAWS colours: yellow = be aware, orange = be prepared, red = take action.
const COLOUR = (text) => (/\b(red|orange)\b/i.test(text) ? 'severe' : /\byellow\b/i.test(text) ? 'warning' : null);
// CAP severity words -> ours.
const CAP_SEVERITY = { extreme: 'severe', severe: 'severe', moderate: 'warning', minor: 'info' };
const RANK = { severe: 0, warning: 1, info: 2 };
const worst = (...levels) => levels.filter(Boolean).sort((a, b) => RANK[a] - RANK[b])[0] ?? 'warning';

// RSS text -> [{ id, title, body, link, province, published }], repeats removed.
export function parseFeed(xml) {
  const seen = new Set();
  return all(xml, 'item')
    .map((item, i) => {
      const published = Date.parse(tag(item, 'pubDate'));
      const link = safeLink(tag(item, 'link'));
      const code = link?.match(/\/([A-Z]{2,3})_CAP_/i)?.[1].toUpperCase();
      return {
        id: tag(item, 'guid') || link || `saws-${i}`,
        title: tag(item, 'title'),
        body: tag(item, 'description'),
        link,
        province: PROVINCE_CODES[code] ?? null,
        published: Number.isFinite(published) ? published : null,
      };
    })
    .filter((item) => (item.title || item.link) && !seen.has(item.id) && seen.add(item.id));
}

// "lat,lon lat,lon ..." -> [[lat, lon], ...]
const toPolygon = (text) =>
  text.trim().split(/\s+/).map((pair) => pair.split(',').map(Number)).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));

// Ray casting: is the point inside the polygon?
export function insidePolygon(lat, lon, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// One CAP file -> a warning, or null when it's a test, a cancel or not CAP at all.
export function parseCap(xml) {
  const infos = all(xml, 'info');
  if (!infos.length) return null;
  if (!/actual/i.test(tag(xml, 'status') || 'Actual') || /cancel/i.test(tag(xml, 'msgType'))) return null;
  const info = infos.find((i) => /^en/i.test(tag(i, 'language'))) ?? infos[0];
  const areas = all(info, 'area').map((area) => ({
    desc: tag(area, 'areaDesc'),
    polygons: all(area, 'polygon').map((p) => toPolygon(tag(p, 'polygon'))).filter((p) => p.length >= 3),
  }));
  const headline = tag(info, 'headline') || tag(info, 'event');
  const expires = Date.parse(tag(info, 'expires'));
  const onset = Date.parse(tag(info, 'onset') || tag(info, 'effective'));
  return {
    title: headline,
    body: [tag(info, 'description'), tag(info, 'instruction')].filter(Boolean).join(' '),
    severity: worst(COLOUR(headline), CAP_SEVERITY[tag(info, 'severity').toLowerCase()]),
    link: safeLink(tag(info, 'web')),
    onset: Number.isFinite(onset) ? onset : null,
    expires: Number.isFinite(expires) ? expires : null,
    areas,
  };
}

// cacheStore (optional) keeps the last feed read across restarts.
export function createSawsService({ url = DEFAULT_SAWS_URL, fetchImpl = fetch, now = Date.now, cacheStore = null } = {}) {
  const enabled = Boolean(url) && url !== 'off';
  const cache = createCache({ staleMs: STALE_MS, cooldownMs: COOLDOWN_MS, now, store: cacheStore, name: 'saws' });
  const capFiles = new Map(); // link -> parsed CAP (they never change), so each is fetched once

  const getText = async (target) => {
    const errors = [];
    for (const attempt of httpsFirst(target)) {
      try {
        const res = await fetchImpl(attempt, { signal: AbortSignal.timeout(8000) });
        if (res.ok) return res.text();
        errors.push(`${attempt}: SAWS answered ${res.status}`);
      } catch (err) {
        // Node only says "fetch failed"; the real reason (bad certificate, DNS, timeout) is in err.cause.
        const why = err.cause?.code || err.cause?.message;
        errors.push(`${attempt}: ${why ? `${err.message} (${why})` : err.message}`);
      }
    }
    throw new Error(errors.join('; '));
  };

  async function readCap(item) {
    if (!item.link) return null;
    if (capFiles.has(item.link)) return capFiles.get(item.link);
    try {
      const cap = parseCap(await getText(item.link));
      capFiles.set(item.link, cap);
      if (capFiles.size > 200) capFiles.delete(capFiles.keys().next().value);
      return cap;
    } catch {
      return null; // fall back to what the feed itself says
    }
  }

  async function load() {
    const items = parseFeed(await getText(url));
    const newest = [...items].sort((a, b) => (b.published ?? 0) - (a.published ?? 0)).slice(0, NEWEST);
    const warnings = await Promise.all(
      newest.map(async (item) => {
        const cap = await readCap(item);
        const text = `${item.title} ${item.body}`;
        return {
          id: item.id,
          published: item.published,
          title: cap?.title || item.title,
          body: cap?.body || item.body,
          link: cap?.link || item.link,
          severity: cap?.severity ?? worst(COLOUR(text)),
          onset: cap?.onset ?? null,
          expires: cap?.expires ?? null,
          areas: cap?.areas ?? [],
          province: item.province,
          fromCap: Boolean(cap),
        };
      }),
    );
    return { warnings, items: items.length, capFiles: warnings.filter((w) => w.fromCap).length };
  }

  // A warning counts for a place when one of its polygons covers it, or (no
  // polygons) when it's for the place's province.
  const covers = (w, lat, lon, province) => {
    const polygons = w.areas.flatMap((a) => a.polygons);
    if (polygons.length) return polygons.some((p) => insidePolygon(lat, lon, p));
    if (w.province) return w.province === province;
    const text = `${w.title} ${w.body} ${w.areas.map((a) => a.desc).join(' ')}`.toLowerCase();
    return text.includes(province.toLowerCase());
  };
  const current = (w) => (w.expires ? w.expires > now() : w.published === null || now() - w.published < MAX_AGE_MS);

  // -> { warnings, province, fetchedAt, stale }, or throws SawsUnavailable
  async function getWarnings(lat, lon) {
    const entry = await cache.get('feed', FRESH_MS, load);
    const province = provinceFor(lat, lon);
    const warnings = entry.value.warnings
      .filter((w) => current(w) && covers(w, lat, lon, province))
      .sort((a, b) => RANK[a.severity] - RANK[b.severity])
      .slice(0, 3);
    return { warnings, province, fetchedAt: entry.fetchedAt, stale: entry.stale };
  }

  // For the start-up log line and GET /api/alerts/saws: what the feed looked like.
  async function check() {
    const entry = await cache.get('feed', FRESH_MS, load);
    return { items: entry.value.items, capFiles: entry.value.capFiles, newest: entry.value.warnings.slice(0, 3).map((w) => ({ title: w.title, expires: w.expires })) };
  }

  return { enabled, getWarnings, check };
}
