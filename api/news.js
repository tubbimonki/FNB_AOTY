// Climate news from free RSS feeds, South Africa first, then global.
// Each feed is cached on its own (one slow site can't break the rest), and if
// every feed fails the page gets the bundled snapshot of real stories instead.
// The feeds couldn't be reached from Claude's container, so the parser is
// forgiving: RSS or Atom, and anything it can't read is skipped.
import { createHash } from 'node:crypto';
import { createCache } from './cache.js';
import { newsSnapshot } from '../shared/newsSnapshot.js';

const DEFAULT_FEEDS = [
  {
    name: 'Google News (South Africa)',
    region: 'za',
    url: 'https://news.google.com/rss/search?q=%22climate+change%22+OR+drought+OR+flood+OR+heatwave+South+Africa+when:30d&hl=en-ZA&gl=ZA&ceid=ZA:en',
  },
  { name: 'Carbon Brief', region: 'global', url: 'https://www.carbonbrief.org/feed/' },
  { name: 'The Guardian', region: 'global', url: 'https://www.theguardian.com/environment/climate-crisis/rss' },
  { name: 'Climate Home News', region: 'global', url: 'https://www.climatechangenews.com/feed/' },
];

const FRESH_MS = 60 * 60 * 1000; // news moves slowly enough: one call per feed an hour
const STALE_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 15 * 60 * 1000;
const MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000; // "the past month"
const MAX_ITEMS = 30;
const MIN_LIVE = 5; // fewer than this and the snapshot tops the list up

const decode = (text) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ') // descriptions often hold HTML
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

const tag = (xml, name) => {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decode(match[1]) : '';
};

// Atom puts the link in an attribute: <link href="..."/>
const linkOf = (xml) => tag(xml, 'link') || xml.match(/<link[^>]*href="([^"]+)"/i)?.[1] || '';

const TOPICS = [
  ['Water', /water|dam|drought|river|sanitation/i],
  ['Energy', /solar|wind|energy|eskom|electric|coal|power|load.?shedding/i],
  ['Weather', /flood|storm|heat|rain|weather|el ni|wildfire|fire/i],
  ['Waste', /plastic|waste|recycl|pollution/i],
  ['Food', /farm|food|crop|maize|agricultur/i],
  ['Policy', /cop\d+|policy|finance|minister|government|treaty|law/i],
];
const topicOf = (text) => TOPICS.find(([, re]) => re.test(text))?.[0] ?? 'Climate';

const shorten = (text, max = 220) => (text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text);

// RSS/Atom text -> [{ id, title, summary, source, date, topic, url, region, published }]
export function parseFeed(xml, feed) {
  const blocks = String(xml).match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  return blocks
    .map((block) => {
      let title = tag(block, 'title');
      const url = linkOf(block).trim();
      const published = Date.parse(tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || tag(block, 'dc:date'));
      // Google News titles end in " - Publisher" and name it in <source>.
      const source = tag(block, 'source') || feed.name;
      if (source !== feed.name && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      let summary = tag(block, 'description') || tag(block, 'summary');
      if (summary.startsWith(title)) summary = ''; // Google News repeats the title as the summary
      return {
        id: createHash('sha1').update(url).digest('hex').slice(0, 12),
        title,
        summary: shorten(summary),
        source,
        date: Number.isFinite(published) ? new Date(published).toISOString().slice(0, 10) : null,
        topic: topicOf(`${title} ${summary}`),
        url,
        region: feed.region,
        published: Number.isFinite(published) ? published : null,
      };
    })
    .filter((item) => item.title && /^https?:\/\//i.test(item.url)); // never javascript: links
}

// Live list: South Africa first, newest first inside each region, no duplicates.
export function mergeFeeds(lists, now = Date.now()) {
  const seen = new Set();
  const items = lists
    .flat()
    .filter((item) => item.published && now - item.published < MAX_AGE_MS)
    .sort((a, b) => (a.region === b.region ? b.published - a.published : a.region === 'za' ? -1 : 1))
    .filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(item.url) || seen.has(key)) return false;
      seen.add(item.url).add(key);
      return true;
    })
    .slice(0, MAX_ITEMS)
    .map(({ published: _published, ...item }, i) => ({ ...item, ...(i < 3 && { top: true }) }));
  return items;
}

export function createNewsService({ feeds = DEFAULT_FEEDS, fetchImpl = fetch, now = Date.now } = {}) {
  const cache = createCache({ staleMs: STALE_MS, cooldownMs: COOLDOWN_MS, now });

  async function loadFeed(feed) {
    const res = await fetchImpl(feed.url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Eco5-climate-app (hackathon project)', Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) throw new Error(`${feed.name} answered ${res.status}`);
    return parseFeed(await res.text(), feed);
  }

  // -> { items, source: 'live' | 'stale' | 'snapshot', feeds: { name: status }, fetchedAt }
  async function getNews() {
    const results = await Promise.allSettled(feeds.map((feed) => cache.get(feed.url, FRESH_MS, () => loadFeed(feed))));
    const status = {};
    const lists = [];
    let stale = false;
    let fetchedAt = null;
    results.forEach((result, i) => {
      if (result.status === 'rejected') return void (status[feeds[i].name] = 'unavailable');
      status[feeds[i].name] = result.value.stale ? 'stale' : 'live';
      stale ||= result.value.stale;
      fetchedAt = Math.max(fetchedAt ?? 0, result.value.fetchedAt);
      lists.push(result.value.value);
    });

    const live = mergeFeeds(lists, now());
    if (live.length === 0) return { items: newsSnapshot, source: 'snapshot', feeds: status, fetchedAt: null };
    const extra = live.length < MIN_LIVE ? newsSnapshot.filter((s) => !live.some((l) => l.url === s.url)) : [];
    return { items: [...live, ...extra.map(({ top: _top, ...s }) => s)], source: stale ? 'stale' : 'live', feeds: status, fetchedAt };
  }

  return { getNews };
}
