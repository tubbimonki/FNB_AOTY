// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createNewsService, mergeFeeds, parseFeed } from './news.js';
import { newsSnapshot } from '../shared/newsSnapshot.js';
import { startTestServer } from './test/startTestServer.js';

const NOW = Date.parse('2026-10-26T08:00:00Z');
const za = { name: 'Google News (South Africa)', region: 'za', url: 'https://za.test/rss' };
const world = { name: 'Carbon Brief', region: 'global', url: 'https://world.test/feed' };

// Google News style RSS: title ends in " - Publisher", <source> names it.
const zaRss = `<?xml version="1.0"?><rss><channel>
  <item><title>Cape Town dams drop again - EWN</title><link>https://ewn.test/dams</link>
    <pubDate>Wed, 14 Oct 2026 04:39:00 GMT</pubDate><description>Cape Town dams drop again EWN</description><source url="https://ewn.test">EWN</source></item>
  <item><title>Old flood story - IOL</title><link>https://iol.test/old</link><pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate><source url="https://iol.test">IOL</source></item>
  <item><title>Bad link</title><link>javascript:alert(1)</link><pubDate>Wed, 14 Oct 2026 04:39:00 GMT</pubDate></item>
</channel></rss>`;

// Atom style feed with HTML in the summary.
const worldAtom = `<feed>
  <entry><title><![CDATA[Solar overtakes coal & gas]]></title><link href="https://cb.test/solar"/>
    <published>2026-10-20T09:00:00Z</published><summary>&lt;p&gt;New &lt;b&gt;analysis&lt;/b&gt; of power data.&lt;/p&gt;</summary></entry>
</feed>`;

const fetchFrom = (bodies) =>
  vi.fn(async (url) => (bodies[url] ? new Response(bodies[url]) : new Response('down', { status: 502 })));

describe('news feeds', () => {
  it('reads RSS and Atom, cleans titles and drops unsafe links', () => {
    const [dams] = parseFeed(zaRss, za);
    expect(dams).toMatchObject({ title: 'Cape Town dams drop again', source: 'EWN', date: '2026-10-14', topic: 'Water', url: 'https://ewn.test/dams', region: 'za', summary: '' });
    expect(parseFeed(zaRss, za).map((i) => i.url)).not.toContain('javascript:alert(1)');
    const [solar] = parseFeed(worldAtom, world);
    expect(solar).toMatchObject({ title: 'Solar overtakes coal & gas', summary: 'New analysis of power data.', topic: 'Energy', source: 'Carbon Brief' });
  });

  it('keeps the past month only, South Africa first, and flags the top three', () => {
    const items = mergeFeeds([parseFeed(worldAtom, world), parseFeed(zaRss, za)], NOW);
    expect(items.map((i) => i.title)).toEqual(['Cape Town dams drop again', 'Solar overtakes coal & gas']);
    expect(items.every((i) => i.top)).toBe(true);
  });

  it('tops up a short live list with the snapshot', async () => {
    const news = createNewsService({ feeds: [za, world], fetchImpl: fetchFrom({ [za.url]: zaRss, [world.url]: worldAtom }), now: () => NOW });
    const result = await news.getNews();
    expect(result.source).toBe('live');
    expect(result.items[0].title).toBe('Cape Town dams drop again');
    expect(result.items).toHaveLength(2 + newsSnapshot.length);
    expect(result.feeds).toEqual({ 'Google News (South Africa)': 'live', 'Carbon Brief': 'live' });
  });

  it('asks each feed once an hour, however many visitors', async () => {
    const fetchImpl = fetchFrom({ [za.url]: zaRss, [world.url]: worldAtom });
    const news = createNewsService({ feeds: [za, world], fetchImpl, now: () => NOW });
    await Promise.all([news.getNews(), news.getNews(), news.getNews()]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('falls back to the snapshot of real stories when every feed fails', async () => {
    const news = createNewsService({ feeds: [za, world], fetchImpl: fetchFrom({}), now: () => NOW });
    const result = await news.getNews();
    expect(result.source).toBe('snapshot');
    expect(result.items).toEqual(newsSnapshot);
    expect(result.feeds).toEqual({ 'Google News (South Africa)': 'unavailable', 'Carbon Brief': 'unavailable' });
  });

  it('snapshot stories all link to a real https source', () => {
    for (const story of newsSnapshot) {
      expect(story.url).toMatch(/^https:\/\//);
      expect(story.date).toMatch(/^2026-\d\d-\d\d$/);
    }
  });
});

describe('GET /api/news', () => {
  let server;
  beforeAll(async () => {
    server = await startTestServer();
  });
  afterAll(() => server.close());

  it('answers with the snapshot when no news service is set', async () => {
    const res = await fetch(`${server.baseUrl}/api/news`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('snapshot');
    expect(body.items.length).toBe(newsSnapshot.length);
  });
});
