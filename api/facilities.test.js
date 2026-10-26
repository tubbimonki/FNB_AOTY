// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createFacilitiesService, distanceKm, FacilitiesUnavailable, overpassQuery, toFacilities } from './facilities.js';
import { createClient, startTestServer } from './test/startTestServer.js';

// A trimmed Overpass answer: nodes have lat/lon, ways and relations have a center.
const OVERPASS = {
  elements: [
    { type: 'node', id: 1, lat: -26.1, lon: 28.24, tags: { amenity: 'clinic', name: 'Kempton Park Clinic', opening_hours: 'Mo-Fr 07:00-16:00' } },
    { type: 'way', id: 2, center: { lat: -26.12, lon: 28.23 }, tags: { amenity: 'hospital', name: 'Arwyp Medical Centre' } },
    { type: 'node', id: 3, lat: -26.1, lon: 28.231, tags: { amenity: 'library' } },
    { type: 'node', id: 4, lat: -26.2, lon: 28.3, tags: { amenity: 'clinic', name: 'Far Clinic' } },
    { type: 'node', id: 5, lat: -26.15, lon: 28.25, tags: { amenity: 'clinic', name: 'Third Clinic' } },
    { type: 'node', id: 6, lat: -26.1, lon: 28.23, tags: { amenity: 'bench' } },
  ],
};
const HERE = { lat: -26.1, lon: 28.23 };
const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe('toFacilities', () => {
  it('maps OSM tags to facility rows, nearest first', () => {
    const rows = toFacilities(OVERPASS, HERE);
    expect(rows[0]).toMatchObject({ id: 'node/3', type: 'library', name: 'Library', distanceKm: 0.1 });
    expect(rows.find((f) => f.type === 'hospital')).toMatchObject({ name: 'Arwyp Medical Centre', url: 'https://www.openstreetmap.org/way/2' });
    expect(rows.find((f) => f.name === 'Kempton Park Clinic').detail).toBe('Clinic, Mo-Fr 07:00-16:00');
  });

  it('keeps at most 2 of a type and skips untyped places', () => {
    const rows = toFacilities(OVERPASS, HERE);
    expect(rows.filter((f) => f.type === 'clinic').map((f) => f.name)).toEqual(['Kempton Park Clinic', 'Third Clinic']);
    expect(rows.some((f) => f.id === 'node/6')).toBe(false);
  });

  it('measures distance in km', () => {
    expect(distanceKm({ lat: -26.2, lon: 28.05 }, { lat: -25.75, lon: 28.19 })).toBeCloseTo(52, 0); // Joburg to Pretoria
  });

  it('asks Overpass with rounded coordinates only', () => {
    expect(overpassQuery(-26.104321, 28.234567)).toContain('around:3000,-26.10,28.23');
  });
});

describe('createFacilitiesService', () => {
  it('caches one answer per rounded place for a day', async () => {
    let clock = 0;
    const fetchImpl = vi.fn(async () => json(OVERPASS));
    const service = createFacilitiesService({ fetchImpl, now: () => clock });

    const first = await service.getFacilities(-26.1, 28.23);
    await service.getFacilities(-26.1004, 28.2301); // same place after rounding
    expect(fetchImpl).toHaveBeenCalledTimes(3); // the 3 servers are asked at once, then cached
    expect(fetchImpl.mock.calls[0][1].method).toBe('POST');
    expect(first).toMatchObject({ source: 'OpenStreetMap', stale: false });

    clock += 25 * 60 * 60 * 1000;
    await service.getFacilities(-26.1, 28.23);
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it('gives up when Overpass is down and nothing is cached', async () => {
    const service = createFacilitiesService({ fetchImpl: async () => json({}, 504) });
    await expect(service.getFacilities(-26.1, 28.23)).rejects.toBeInstanceOf(FacilitiesUnavailable);
  });
});

describe('GET /api/services/facilities', () => {
  it('answers with live facilities, 400 for bad input, 503 when down', async () => {
    let up = true;
    const facilities = createFacilitiesService({ fetchImpl: async () => (up ? json(OVERPASS) : json({}, 504)) });
    const api = await startTestServer({ facilities });
    const client = createClient(api.baseUrl);
    try {
      const ok = await client.request('GET', '/api/services/facilities?lat=-26.1&lon=28.23');
      expect(ok.status).toBe(200);
      expect(ok.body.facilities.length).toBeGreaterThan(0);
      expect((await client.request('GET', '/api/services/facilities?lat=abc&lon=28')).status).toBe(400);
      up = false;
      expect((await client.request('GET', '/api/services/facilities?lat=-33.9&lon=18.4')).status).toBe(503);
    } finally {
      await api.close();
    }
  });
});

describe('Overpass servers', () => {
  it('uses another server when one is busy or blocks us', async () => {
    const fetchImpl = vi.fn(async (server) => {
      if (server.includes('overpass-api.de')) return json({}, 429);
      if (server.includes('kumi')) return json({ remark: 'runtime error: Query timed out', elements: [] });
      return json(OVERPASS);
    });
    const { facilities } = await createFacilitiesService({ fetchImpl }).getFacilities(-26.1, 28.23);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(facilities.length).toBeGreaterThan(0);
  });

  it('puts OVERPASS_URL first and keeps the mirrors as backup', async () => {
    const fetchImpl = vi.fn(async () => json(OVERPASS));
    await createFacilitiesService({ url: 'https://my.overpass/api/interpreter', fetchImpl }).getFacilities(-26.1, 28.23);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://my.overpass/api/interpreter');
  });

  it('says why every server failed', async () => {
    const service = createFacilitiesService({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('html'); } }) });
    await expect(service.getFacilities(-26.1, 28.23)).rejects.toThrow(/not JSON/);
  });
});

describe('Nominatim backup', () => {
  it('finds places with OSM search when every Overpass server fails', async () => {
    const fetchImpl = vi.fn(async (server) => {
      if (!server.includes('nominatim')) return json({}, 502);
      if (!server.includes('q=clinic')) return json([]);
      return json([{ osm_type: 'node', osm_id: 9, lat: '-26.105', lon: '28.232', category: 'amenity', type: 'clinic', name: 'Rhodesfield Clinic' }]);
    });
    const { facilities } = await createFacilitiesService({ fetchImpl, pauseMs: 0 }).getFacilities(-26.1, 28.23);
    expect(facilities).toEqual([expect.objectContaining({ id: 'node/9', type: 'clinic', name: 'Rhodesfield Clinic' })]);
    const searches = fetchImpl.mock.calls.filter(([u]) => u.includes('nominatim'));
    expect(searches).toHaveLength(6); // one per kind of place
    expect(searches[0][0]).toContain('bounded=1');
  });
});

describe('places for the map', () => {
  it('returns every place with its position, plus the short list', async () => {
    const service = createFacilitiesService({ fetchImpl: async () => json(OVERPASS) });
    const { places, facilities } = await service.getFacilities(-26.1, 28.23);
    expect(places).toHaveLength(5); // all typed places, the bench is skipped
    expect(places.find((p) => p.id === 'way/2')).toMatchObject({ lat: -26.12, lon: 28.23 });
    expect(facilities.length).toBeLessThan(places.length);
  });
});
