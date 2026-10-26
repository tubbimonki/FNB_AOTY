import { Router } from 'express';
import { count, desc, eq, isNotNull } from 'drizzle-orm';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateReport } from '../../../shared/reports.js';
import { SAMPLE_EVENTS, SAMPLE_PINS, SAMPLE_UPDATES } from './sampleData.js';
import { reports } from './schema.js';

// Map pins, local updates, events, and residents' reports (reports table).
// TODO(events): emit 'report.created' so impact can award points (guide 2).
// TODO(moderation): new reports should show as unverified until checked.
const MAX_PER_USER = 20;
const MAP_PINS = 300; // newest reports shown on the map
const roundSpot = (n) => (n === undefined ? null : Math.round(n * 1000) / 1000);

const toReport = (row) => ({
  id: row.id,
  category: row.category,
  description: row.description,
  lat: row.lat ?? undefined,
  lon: row.lon ?? undefined,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});

export default {
  name: 'community',
  events: { emits: ['report.created'], listens: [] },

  router({ db, jwtSecret }) {
    const router = Router();
    const auth = requireAuth({ db, jwtSecret });

    // GET /api/community/pins -> { pins, sample }. Residents' reports join the sample pins.
    router.get('/pins', async (req, res) => {
      const rows = await db.select().from(reports).where(isNotNull(reports.lat)).orderBy(desc(reports.createdAt)).limit(MAP_PINS);
      const reportPins = rows.map((r) => ({ id: `r${r.id}`, type: 'report', title: r.category, detail: r.description, lat: r.lat, lon: r.lon }));
      res.json({ pins: [...SAMPLE_PINS, ...reportPins], sample: true });
    });

    // GET /api/community/updates -> { updates, events, sample }
    router.get('/updates', (req, res) => {
      res.json({ updates: SAMPLE_UPDATES, events: SAMPLE_EVENTS, sample: true });
    });

    // POST /api/community/reports { category, description, lat?, lon? } -> 201 { report }
    router.post('/reports', auth, async (req, res) => {
      const error = validateReport(req.body);
      if (error) return res.status(400).json({ error });
      const [{ n }] = await db.select({ n: count() }).from(reports).where(eq(reports.userId, req.user.id));
      if (n >= MAX_PER_USER) return res.status(429).json({ error: `You can have ${MAX_PER_USER} reports at a time` });

      const { category, description, lat, lon } = req.body;
      const [row] = await db
        .insert(reports)
        // 3 decimals is about 100 m: close enough to find a pothole, not someone's house.
        .values({ userId: req.user.id, category, description: description.trim(), lat: roundSpot(lat), lon: roundSpot(lon) })
        .returning();
      res.status(201).json({ report: toReport(row) });
    });

    // GET /api/community/reports/mine -> { reports }, newest first. Only your own.
    router.get('/reports/mine', auth, async (req, res) => {
      const rows = await db.select().from(reports).where(eq(reports.userId, req.user.id)).orderBy(desc(reports.createdAt), desc(reports.id));
      res.json({ reports: rows.map(toReport) });
    });

    return router;
  },
};
