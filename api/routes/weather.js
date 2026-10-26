import { Router } from 'express';
import { WeatherUnavailable } from '../weather.js';

// GET /api/weather?lat=-26.2&lon=28.05 -> { current, days, fetchedAt, stale }
// Public on purpose: weather isn't personal, and the cache is shared.
export function weatherRouter({ weather }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    // Number('') is 0, so check the raw value is there too.
    const valid =
      req.query.lat && req.query.lon &&
      Number.isFinite(lat) && Math.abs(lat) <= 90 &&
      Number.isFinite(lon) && Math.abs(lon) <= 180;
    if (!valid) return res.status(400).json({ error: 'lat and lon must be numbers' });

    try {
      res.json(await weather.getWeather(lat, lon));
    } catch (err) {
      if (!(err instanceof WeatherUnavailable)) throw err;
      res.status(503).json({ error: 'Weather is unavailable right now' });
    }
  });

  return router;
}
