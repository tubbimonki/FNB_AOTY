import { Router } from 'express';
import { and, count, desc, eq } from 'drizzle-orm';
import { requireAuth } from '../../middleware/requireAuth.js';
import { estimateFootprint } from '../../../shared/footprint.js';
import { isClientId, isDay } from '../../../shared/checks.js';
import { footprints, waterLogs } from './schema.js';

// Footprint estimates and water logs, saved per user in Postgres.
// Water logs sync like Green Wallet's (see api/modules/wallet).
// TODO(events): emit 'water.logged' and 'footprint.saved' for impact points.
const MAX_PER_USER = 500;
const MAX_SYNC = 500;

// A water log from the browser -> a row, or an error message.
// Older clients sent no id, so the server makes one.
function toRow(userId, { id = crypto.randomUUID(), litres, use = 'other', date } = {}) {
  if (!isClientId(id)) return 'id is invalid';
  if (!Number.isFinite(litres) || litres <= 0 || litres > 2000) return 'litres must be a number between 1 and 2000';
  if (!isDay(date)) return 'date must look like 2026-10-25';
  return { userId, id, litres, use: String(use).slice(0, 30), date };
}

const toLog = (row) => ({ id: row.id, litres: row.litres, use: row.use, date: row.date });
const toSaved = (row) => (row ? { answers: row.answers, total: row.totalT, savedAt: row.updatedAt.getTime() } : null);

export default {
  name: 'eco',
  events: { emits: ['water.logged', 'footprint.saved'], listens: [] },

  router({ db, jwtSecret }) {
    const router = Router();
    const auth = requireAuth({ db, jwtSecret });

    const listFor = async (userId) =>
      (await db.select().from(waterLogs).where(eq(waterLogs.userId, userId)).orderBy(desc(waterLogs.date), desc(waterLogs.createdAt))).map(toLog);
    const countFor = async (userId) =>
      (await db.select({ n: count() }).from(waterLogs).where(eq(waterLogs.userId, userId)))[0].n;

    // POST /api/eco/footprint { kwhPerMonth, householdSize, ... } -> { total, breakdown }
    // Worked out on the server with the same code as the page, so the numbers match.
    router.post('/footprint', (req, res) => {
      res.json(estimateFootprint(req.body ?? {}));
    });

    // GET /api/eco/footprint/mine -> { value: { answers, total, savedAt } | null }
    router.get('/footprint/mine', auth, async (req, res) => {
      const [row] = await db.select().from(footprints).where(eq(footprints.userId, req.user.id)).limit(1);
      res.json({ value: toSaved(row) });
    });

    // PUT /api/eco/footprint/mine { value: { answers } } -> { value }. The server works out the total.
    router.put('/footprint/mine', auth, async (req, res) => {
      const answers = req.body?.value?.answers;
      if (!answers || typeof answers !== 'object' || Array.isArray(answers) || JSON.stringify(answers).length > 2000) {
        return res.status(400).json({ error: 'answers must be an object' });
      }
      const row = { userId: req.user.id, answers, totalT: estimateFootprint(answers).total, updatedAt: new Date() };
      const [saved] = await db.insert(footprints).values(row).onConflictDoUpdate({ target: footprints.userId, set: row }).returning();
      res.json({ value: toSaved(saved) });
    });

    // POST /api/eco/water/logs { id?, litres, use, date } -> 201 { log }
    router.post('/water/logs', auth, async (req, res) => {
      const row = toRow(req.user.id, req.body ?? {});
      if (typeof row === 'string') return res.status(400).json({ error: row });
      if ((await countFor(req.user.id)) >= MAX_PER_USER) {
        return res.status(429).json({ error: `You can keep ${MAX_PER_USER} water logs` });
      }
      await db.insert(waterLogs).values(row).onConflictDoNothing();
      res.status(201).json({ log: toLog(row) });
    });

    // GET /api/eco/water/logs -> { logs }, your own only, newest first.
    router.get('/water/logs', auth, async (req, res) => {
      res.json({ logs: await listFor(req.user.id) });
    });

    // POST /api/eco/water/logs/sync { logs: [...] } -> { logs }
    router.post('/water/logs/sync', auth, async (req, res) => {
      const incoming = req.body?.logs;
      if (!Array.isArray(incoming) || incoming.length > MAX_SYNC) {
        return res.status(400).json({ error: `logs must be a list of up to ${MAX_SYNC}` });
      }
      const room = MAX_PER_USER - (await countFor(req.user.id));
      const rows = incoming.map((log) => toRow(req.user.id, log)).filter((row) => typeof row !== 'string').slice(0, Math.max(room, 0));
      if (rows.length) await db.insert(waterLogs).values(rows).onConflictDoNothing();
      res.json({ logs: await listFor(req.user.id) });
    });

    // DELETE /api/eco/water/logs/:id -> 204
    router.delete('/water/logs/:id', auth, async (req, res) => {
      await db.delete(waterLogs).where(and(eq(waterLogs.userId, req.user.id), eq(waterLogs.id, req.params.id)));
      res.status(204).end();
    });

    return router;
  },
};
