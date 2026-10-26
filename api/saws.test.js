// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createSawsService, insidePolygon, parseCap, parseFeed, provinceFor } from './saws.js';

const NOW = Date.parse('2026-10-26T06:00:00Z');

// Shaped like CAP 1.2: https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html
const cap = ({ headline, severity = 'Moderate', expires = '2026-10-26T22:00:00+02:00', polygon, areaDesc = 'City of Ekurhuleni', status = 'Actual', msgType = 'Alert' }) => `<?xml version="1.0"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>x</identifier><status>${status}</status><msgType>${msgType}</msgType>
  <info>
    <language>en-ZA</language><event>Disruptive Rain</event><severity>${severity}</severity>
    <onset>2026-10-26T12:00:00+02:00</onset><expires>${expires}</expires>
    <headline>${headline}</headline>
    <description>Heavy downpours leading to flooding of roads &amp; settlements.</description>
    <instruction>Avoid crossing flooded rivers.</instruction>
    <area><areaDesc>${areaDesc}</areaDesc>${polygon ? `<polygon>${polygon}</polygon>` : ''}</area>
  </info>
</alert>`;

// A box around Kempton Park / OR Tambo (lat,lon pairs, closed).
const EKURHULENI = '-26.0,28.1 -26.0,28.4 -26.3,28.4 -26.3,28.1 -26.0,28.1';
const CAPE_TOWN = '-33.8,18.3 -33.8,18.7 -34.1,18.7 -34.1,18.3 -33.8,18.3';

// Same shape as the real feed (see test/saws-feed-sample.xml): a title, impacts, a CAP link named by province.
const W = 'http://www.weathersa.co.za/Documents/Warnings';
const item = (file, title, date) =>
  `<item><guid isPermaLink="true">${W}/${file}</guid><link>${W}/${file}</link><title> ${title}</title><description>Localised flooding</description><pubDate>${date}</pubDate></item>`;
const feed = `<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel><title>Latest alerts from South Africa Weather Service</title>
  ${item('GP_CAP_DisruptiveRain_20261026_060000.xml', 'Disruptive Rain', 'Mon, 26 Oct 2026 06:00:00 +0200')}
  ${item('GP_CAP_DisruptiveRain_20261026_060000.xml', 'Disruptive Rain', 'Mon, 26 Oct 2026 06:00:00 +0200')}
  ${item('WC_CAP_DamagingWinds_20261026_050000.xml', 'Damaging Winds', 'Mon, 26 Oct 2026 05:00:00 +0200')}
  ${item('GP_CAP_DisruptiveRain_20260601_050000.xml', 'Disruptive Rain', 'Mon, 01 Jun 2026 05:00:00 +0200')}
  <item><title>Bad link</title><link>javascript:alert(1)</link><guid>bad</guid></item>
</channel></rss>`;

const https = (file) => `https://www.weathersa.co.za/Documents/Warnings/${file}`;
const files = {
  'https://caps.weathersa.co.za/Home/RssFeed': feed,
  [https('GP_CAP_DisruptiveRain_20261026_060000.xml')]: cap({ headline: 'Orange Level 5 Warning: Disruptive Rain', severity: 'Moderate', polygon: EKURHULENI }),
  [https('WC_CAP_DamagingWinds_20261026_050000.xml')]: cap({ headline: 'Yellow Level 2 Warning: Damaging Winds', polygon: CAPE_TOWN }),
  [https('GP_CAP_DisruptiveRain_20260601_050000.xml')]: cap({ headline: 'Old warning', expires: '2026-06-02T00:00:00+02:00', polygon: EKURHULENI }),
};
const fakeFetch = () => vi.fn(async (url) => (files[url] ? new Response(files[url]) : new Response('nope', { status: 404 })));

describe('SAWS warnings', () => {
  it('reads the real feed: trims titles, removes repeats, finds the province', () => {
    const items = parseFeed(readFileSync(new URL('./test/saws-feed-sample.xml', import.meta.url), 'utf8'));
    expect(items.map((i) => [i.title, i.province])).toEqual([
      ['Damaging Winds', 'Free State'],
      ['Damaging Winds', 'Gauteng'],
      ['Damaging Waves', 'KwaZulu-Natal'],
      ['Damaging Winds', 'KwaZulu-Natal'],
    ]);
    expect(items[1]).toMatchObject({
      link: 'http://www.weathersa.co.za/Documents/Warnings/GP_CAP_DamagingWinds_20261019_095710.xml',
      published: Date.parse('2026-10-19T07:56:48Z'),
    });
  });

  it('drops unsafe links and repeats', () => {
    const items = parseFeed(feed);
    expect(items).toHaveLength(4);
    expect(items.at(-1).link).toBeNull();
    expect(parseFeed('not xml')).toEqual([]);
  });

  it('reads a CAP file: headline, colour level, expiry and polygon', () => {
    const w = parseCap(files[https('GP_CAP_DisruptiveRain_20261026_060000.xml')]);
    expect(w).toMatchObject({ title: 'Orange Level 5 Warning: Disruptive Rain', severity: 'severe', expires: Date.parse('2026-10-26T20:00:00Z') });
    expect(w.body).toBe('Heavy downpours leading to flooding of roads & settlements. Avoid crossing flooded rivers.');
    expect(w.areas[0].polygons[0]).toHaveLength(5);
    expect(parseCap(cap({ headline: 'x', status: 'Test' }))).toBeNull();
    expect(parseCap(cap({ headline: 'x', msgType: 'Cancel' }))).toBeNull();
    expect(parseCap('<html>not cap</html>')).toBeNull();
  });

  it('shows only current warnings that cover the place', async () => {
    const saws = createSawsService({ fetchImpl: fakeFetch(), now: () => NOW });
    const kempton = await saws.getWarnings(-26.1, 28.23);
    expect(kempton.warnings.map((w) => w.title)).toEqual(['Orange Level 5 Warning: Disruptive Rain']);
    expect(kempton.province).toBe('Gauteng');
    const capeTown = await saws.getWarnings(-33.92, 18.42);
    expect(capeTown.warnings.map((w) => w.severity)).toEqual(['warning']);
    expect((await saws.getWarnings(-29.86, 31.03)).warnings).toEqual([]); // Durban: nothing covers it
  });

  it('falls back to the feed text when a CAP file is missing', async () => {
    const fetchImpl = vi.fn(async (url) => (url.endsWith('RssFeed') ? new Response(feed) : new Response('down', { status: 500 })));
    const saws = createSawsService({ fetchImpl, now: () => NOW });
    const { warnings } = await saws.getWarnings(-26.1, 28.23);
    expect(warnings.map((w) => [w.title, w.severity])).toEqual([['Disruptive Rain', 'warning']]); // the GP file, by its name
    expect(fetchImpl).toHaveBeenCalledWith('http://www.weathersa.co.za/Documents/Warnings/GP_CAP_DisruptiveRain_20261026_060000.xml', expect.anything());
  });

  it('asks SAWS once per 30 minutes and opens each CAP file once', async () => {
    const fetchImpl = fakeFetch();
    let clock = NOW;
    const saws = createSawsService({ fetchImpl, now: () => clock });
    await saws.getWarnings(-26.1, 28.23);
    const first = fetchImpl.mock.calls.length; // feed + 3 CAP files
    await saws.getWarnings(-33.9, 18.5);
    expect(fetchImpl.mock.calls.length).toBe(first);
    clock += 31 * 60 * 1000;
    await saws.getWarnings(-26.1, 28.23);
    expect(fetchImpl.mock.calls.length).toBe(first + 1); // just the feed again
    expect(await saws.check()).toMatchObject({ items: 4, capFiles: 3 });
    expect(createSawsService({ url: 'off' }).enabled).toBe(false);
  });

  it('finds points in polygons and provinces', () => {
    const box = [[0, 0], [0, 2], [2, 2], [2, 0]];
    expect(insidePolygon(1, 1, box)).toBe(true);
    expect(insidePolygon(3, 1, box)).toBe(false);
    expect(provinceFor(-26.1, 28.23)).toBe('Gauteng');
    expect(provinceFor(-33.9, 18.5)).toBe('Western Cape');
  });
});
