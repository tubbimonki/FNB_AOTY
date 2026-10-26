// Official warnings from the South African Weather Service (SAWS).
// SAWS has no JSON API, but it publishes its warnings as a CAP RSS feed, listed
// in the WMO register of alerting authorities:
// https://alertingauthority.wmo.int/authorities.php?recId=152
// The feed's exact item format couldn't be checked from Claude's container, so
// the parser below is forgiving: anything it can't read is skipped, and if the
// feed is down the alerts page simply leaves SAWS out.
import { createCache, Unavailable } from './cache.js';

export const DEFAULT_SAWS_URL = 'http://caps.weathersa.co.za/Home/RssFeed';
const FRESH_MS = 30 * 60 * 1000;
const STALE_MS = 6 * 60 * 60 * 1000;
const COOLDOWN_MS = 15 * 60 * 1000;
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // older warnings have usually expired

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

const tag = (xml, name) => {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decode(match[1]) : '';
};

// SAWS colours: yellow = be aware, orange = be prepared, red = take action.
const severityOf = (text) => {
  if (/\b(red|orange)\b|level\s*([5-9]|10)\b/i.test(text)) return 'severe';
  if (/\byellow\b|level\s*[1-4]\b|warning/i.test(text)) return 'warning';
  return 'info';
};

// RSS text -> [{ id, title, body, link, published, severity }]
export function parseFeed(xml) {
  const items = String(xml).match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  return items
    .map((item, i) => {
      const title = tag(item, 'title');
      const body = tag(item, 'description');
      const published = Date.parse(tag(item, 'pubDate'));
      return {
        id: tag(item, 'guid') || tag(item, 'link') || `saws-${i}`,
        title,
        body,
        link: /^https?:\/\//i.test(tag(item, 'link')) ? tag(item, 'link') : null, // never javascript: links
        published: Number.isFinite(published) ? published : null,
        severity: severityOf(`${title} ${body}`),
      };
    })
    .filter((item) => item.title);
}

export function createSawsService({ url = DEFAULT_SAWS_URL, fetchImpl = fetch, now = Date.now } = {}) {
  const enabled = Boolean(url) && url !== 'off';
  const cache = createCache({ staleMs: STALE_MS, cooldownMs: COOLDOWN_MS, now });

  async function load() {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`SAWS feed answered ${res.status}`);
    return parseFeed(await res.text());
  }

  // Warnings that name the place's province and aren't too old.
  // -> { warnings, province, fetchedAt, stale }, or throws SawsUnavailable
  async function getWarnings(lat, lon) {
    const entry = await cache.get('feed', FRESH_MS, load);
    const province = provinceFor(lat, lon);
    const warnings = entry.value
      .filter((w) => `${w.title} ${w.body}`.toLowerCase().includes(province.toLowerCase()))
      .filter((w) => w.published === null || now() - w.published < MAX_AGE_MS)
      .slice(0, 3);
    return { warnings, province, fetchedAt: entry.fetchedAt, stale: entry.stale };
  }

  return { enabled, getWarnings };
}
