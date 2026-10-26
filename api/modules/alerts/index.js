import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../middleware/requireAuth.js';
import { CHECKLIST } from '../../../shared/checklist.js';
import { weatherAlerts } from '../../../shared/weatherAlerts.js';
import { aqiBand } from '../../airQuality.js';
import { SAMPLE_ALERTS } from './sampleData.js';
import { checklistTicks } from './schema.js';

// Every alert for a place, from four sources, each cached in its own service
// so this route never adds upstream calls of its own:
//   weather  Open-Meteo forecast (api/weather.js, shared with /api/weather)
//   power    EskomSePush area status (api/eskom.js, shared with /api/services/status)
//   air      Open-Meteo air quality (api/airQuality.js)
//   saws     SA Weather Service warnings feed (api/saws.js)
// One source failing never hides the others. Only when none answers do we
// fall back to sample alerts, and the answer says sample: true.
// Upstream answers are cached by each service (api_cache table for EskomSePush).
// The emergency checklist ticks are saved per user in checklist_ticks.
// TODO(events): emit 'alert.issued' for new severe alerts (push notifications later).

const RANK = { severe: 0, warning: 1, info: 2 };
const bySeverity = (a, b) => (RANK[a.severity] ?? 3) - (RANK[b.severity] ?? 3);

// Runs one source. -> { status: 'live' | 'stale' | 'off' | 'unavailable', alerts }
async function fromSource(name, load) {
  try {
    const result = await load();
    if (!result) return { status: 'off', alerts: [] };
    return { status: result.stale ? 'stale' : 'live', alerts: result.alerts };
  } catch (err) {
    console.error(`Alerts (${name}):`, err.message);
    return { status: 'unavailable', alerts: [] };
  }
}

// EskomSePush's electricity/water shapes -> alerts. 'ok' and 'unknown' raise nothing.
export function powerAlerts({ electricity, water }) {
  const where = electricity?.area ?? 'Your area';
  const alerts = [];
  const power = {
    outage: ['severe', 'Power is off in your area'],
    scheduled: ['warning', 'Planned power outage'],
    intermittent: ['warning', 'Power cuts reported nearby'],
  }[electricity?.status];
  if (power) alerts.push({ id: 'power', severity: power[0], icon: '⚡', title: power[1], body: electricity.message, where, source: 'EskomSePush', href: '/services' });
  const tap = { outage: ['severe', 'Water outage in your area'], intermittent: ['warning', 'Water cuts reported nearby'] }[water?.status];
  if (tap) alerts.push({ id: 'water', severity: tap[0], icon: '🚰', title: tap[1], body: water.message, where, source: 'EskomSePush neighbour reports', href: '/services' });
  return alerts;
}

// US AQI -> an alert once the air is worse than "good".
export function airAlert({ aqi, pm25 }, where) {
  if (aqi <= 50) return [];
  const severity = aqi > 150 ? 'severe' : aqi > 100 ? 'warning' : 'info';
  const advice = aqi > 100
    ? 'Keep windows closed, skip outdoor exercise and check on anyone with asthma.'
    : 'Sensitive groups should keep outdoor exercise short. Skip burning garden waste.';
  const pm = Number.isFinite(pm25) ? ` PM2.5 is ${Math.round(pm25)} µg/m³.` : '';
  return [{ id: 'air', severity, icon: '🌫️', title: `Air quality: ${aqiBand(aqi)} (AQI ${Math.round(aqi)})`, body: `${advice}${pm}`, where, source: 'Open-Meteo air quality' }];
}

export default {
  name: 'alerts',
  events: { emits: ['alert.issued'], listens: [] },

  router({ db, jwtSecret, weather, eskom, airQuality, saws }) {
    const router = Router();
    const auth = requireAuth({ db, jwtSecret });
    const known = new Set(CHECKLIST.map((item) => item.id));

    const ticksFor = async (userId) =>
      (await db.select({ itemId: checklistTicks.itemId }).from(checklistTicks).where(eq(checklistTicks.userId, userId))).map((t) => t.itemId);

    // GET /api/alerts/checklist -> { value: ['charge', 'kit', ...] }
    router.get('/checklist', auth, async (req, res) => {
      res.json({ value: await ticksFor(req.user.id) });
    });

    // PUT /api/alerts/checklist { value: [...ids] } -> { value }. Replaces all ticks.
    router.put('/checklist', auth, async (req, res) => {
      const ids = req.body?.value;
      if (!Array.isArray(ids) || ids.length > 100) return res.status(400).json({ error: 'value must be a list of item ids' });
      const keep = [...new Set(ids)].filter((id) => known.has(id)); // ignore removed items
      // A transaction: the delete and the insert happen together or not at all.
      await db.transaction(async (tx) => {
        await tx.delete(checklistTicks).where(eq(checklistTicks.userId, req.user.id));
        if (keep.length) await tx.insert(checklistTicks).values(keep.map((itemId) => ({ userId: req.user.id, itemId })));
      });
      res.json({ value: keep });
    });

    // GET /api/alerts?lat=-26.2&lon=28.05&place=Johannesburg
    // -> { alerts, sources: { weather, power, air, saws }, sample }
    router.get('/', async (req, res) => {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const valid =
        req.query.lat && req.query.lon &&
        Number.isFinite(lat) && Math.abs(lat) <= 90 &&
        Number.isFinite(lon) && Math.abs(lon) <= 180;
      if (!valid) return res.status(400).json({ error: 'lat and lon must be numbers' });
      const place = String(req.query.place ?? '').slice(0, 60) || 'Your area';

      const [wx, power, air, official] = await Promise.all([
        fromSource('weather', async () => {
          if (!weather) return null;
          const w = await weather.getWeather(lat, lon);
          return { stale: w.stale, alerts: weatherAlerts(w, place) };
        }),
        fromSource('power', async () => {
          if (!eskom?.enabled) return null;
          const area = await eskom.getArea();
          return { stale: area.electricity?.stale, alerts: powerAlerts(area) };
        }),
        fromSource('air', async () => {
          if (!airQuality) return null;
          const a = await airQuality.getAir(lat, lon);
          return { stale: a.stale, alerts: airAlert(a, place) };
        }),
        fromSource('saws', async () => {
          if (!saws?.enabled) return null;
          const s = await saws.getWarnings(lat, lon);
          return {
            stale: s.stale,
            alerts: s.warnings.map((w, i) => ({
              id: `saws-${i}`, severity: w.severity, icon: '📢', title: w.title, body: w.body,
              where: s.province, source: 'SA Weather Service', href: w.link,
            })),
          };
        }),
      ]);

      const sources = { weather: wx.status, power: power.status, air: air.status, saws: official.status };
      const anyLive = Object.values(sources).some((s) => s === 'live' || s === 'stale');
      if (!anyLive) return res.json({ alerts: SAMPLE_ALERTS, sources, sample: true });

      const alerts = [...official.alerts, ...wx.alerts, ...power.alerts, ...air.alerts]
        .map((alert) => ({ kind: 'alert', ...alert }))
        .sort(bySeverity);
      res.json({ alerts, sources, sample: false });
    });

    return router;
  },
};
