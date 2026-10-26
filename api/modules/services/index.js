import { Router } from 'express';
import { SAMPLE_STATUS } from './sampleData.js';
import { FacilitiesUnavailable } from '../../facilities.js';

// Water, electricity, transport and waste status for an area, plus nearby facilities.
// Live: electricity (and water, when neighbours report it) from EskomSePush
// when ESKOMSEPUSH_TOKEN is set (api/eskom.js); facilities from OpenStreetMap
// (api/facilities.js, no key). Transport and waste have no public API, so they
// stay demo data and the page says so.
// Both caches are also saved in the api_cache table, so a restart doesn't spend calls.
// TODO(scheduler): refresh them on a timer instead of when a visitor asks.
// TODO(events): emit 'service.changed' when the area status changes, so alerts can warn.
export default {
  name: 'services',
  events: { emits: ['service.changed'], listens: [] },

  router({ eskom, facilities }) {
    const router = Router();

    // GET /api/services/status -> { area, services, facilities, sample, live }
    // live lists the services that are real; everything else is demo data.
    router.get('/status', async (req, res) => {
      const body = { ...SAMPLE_STATUS, sample: true, live: [] };
      if (eskom?.enabled) {
        try {
          const live = await eskom.getArea();
          body.services = { ...body.services, electricity: live.electricity };
          body.live = ['electricity'];
          if (live.water) {
            body.services.water = live.water;
            body.live.push('water');
          }
        } catch (err) {
          console.error('EskomSePush:', err.message); // the page only says it couldn't reach it
          body.services = {
            ...body.services,
            electricity: {
              status: 'unknown',
              title: 'Electricity',
              message: "Couldn't reach EskomSePush. Try again later.",
              updates: [],
              schedule: [],
            },
          };
        }
      }
      res.json(body);
    });

    // GET /api/services/facilities?lat=-26.1&lon=28.23 -> { facilities (short list), places (map dots), source, fetchedAt, stale }
    // 503 when OpenStreetMap can't be reached; the page then shows demo facilities.
    router.get('/facilities', async (req, res) => {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const valid =
        req.query.lat && req.query.lon &&
        Number.isFinite(lat) && Math.abs(lat) <= 90 &&
        Number.isFinite(lon) && Math.abs(lon) <= 180;
      if (!valid) return res.status(400).json({ error: 'lat and lon must be numbers' });
      if (!facilities) return res.status(503).json({ error: 'Facilities are switched off' });

      try {
        res.json(await facilities.getFacilities(lat, lon));
      } catch (err) {
        if (!(err instanceof FacilitiesUnavailable)) throw err;
        res.status(503).json({ error: 'Facilities are unavailable right now' });
      }
    });

    return router;
  },
};
