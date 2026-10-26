import { Router } from 'express';
import { SAMPLE_STATUS } from './sampleData.js';
import { FacilitiesUnavailable } from '../../facilities.js';

// Water, electricity, transport and waste status for an area, plus nearby facilities.
// Live: electricity (and water, when neighbours report it) from EskomSePush
// when ESKOMSEPUSH_TOKEN is set (api/eskom.js); facilities from OpenStreetMap
// (api/facilities.js, no key). Transport and waste have no public API, so they
// stay demo data and the page says so.
// Both caches are also saved in the api_cache table, so a restart doesn't spend calls,
// and api/warmup.js refreshes them on a timer so visitors rarely wait.
// When the area's power or water status changes, it says 'service.changed' on the bus.
export default {
  name: 'services',
  events: { emits: ['service.changed'], listens: [] },

  router({ eskom, facilities, bus }) {
    const router = Router();
    const last = {}; // service -> the status we saw last time

    // Compares with the last answer and announces changes. The first answer
    // after a start only sets the baseline.
    const noticeChanges = async (services, area) => {
      for (const service of ['electricity', 'water']) {
        const now = services[service];
        if (!now?.status || now.status === 'unknown') continue;
        const before = last[service];
        last[service] = now.status;
        if (before && before !== now.status) {
          const at = new Date().toISOString().slice(0, 13); // one per hour at most
          await bus.emit('service.changed', { service, area, from: before, to: now.status, message: now.message, at });
        }
      }
    };

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
          await noticeChanges(body.services, live.electricity?.area ?? 'your area');
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
