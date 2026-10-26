import { Router } from 'express';
import { and, count, desc, eq } from 'drizzle-orm';
import { requireAuth } from '../../middleware/requireAuth.js';
import { findAction } from '../../../shared/actions.js';
import { isClientId, isLogDay } from '../../../shared/checks.js';
import { walletLogs } from './schema.js';

// Green Wallet logs, saved per user in the wallet_logs table.
// The browser keeps a copy too (works offline and for guests) and sends
// anything it saved offline to POST /sync, which skips logs it already has.
// Every new log is announced as 'log.created' { userId, logs } (a sync can bring many).
const MAX_PER_USER = 2000;
const MAX_SYNC = 500;

// A log from the browser -> a row, or an error message.
function toRow(userId, { id, actionId, date } = {}) {
  if (!isClientId(id)) return 'id is missing or invalid';
  const action = findAction(actionId);
  if (!action) return 'Unknown action';
  if (!isLogDay(date)) return 'date must be a real day, no later than today';
  return { userId, id, actionId, category: action.category, date, co2Kg: action.co2Kg, rand: action.rand };
}

const toLog = (row) => ({ id: row.id, actionId: row.actionId, date: row.date });

export default {
  name: 'wallet',
  events: { emits: ['log.created'], listens: [] },

  router({ db, jwtSecret, bus }) {
    const router = Router();
    router.use(requireAuth({ db, jwtSecret })); // every route here is personal

    const listFor = async (userId) =>
      (await db.select().from(walletLogs).where(eq(walletLogs.userId, userId)).orderBy(desc(walletLogs.date), desc(walletLogs.createdAt))).map(toLog);

    const countFor = async (userId) =>
      (await db.select({ n: count() }).from(walletLogs).where(eq(walletLogs.userId, userId)))[0].n;

    // GET /api/wallet/logs -> { logs }, newest first
    router.get('/logs', async (req, res) => {
      res.json({ logs: await listFor(req.user.id) });
    });

    // POST /api/wallet/logs { id, actionId, date } -> 201 { log }
    router.post('/logs', async (req, res) => {
      const row = toRow(req.user.id, req.body);
      if (typeof row === 'string') return res.status(400).json({ error: row });
      if ((await countFor(req.user.id)) >= MAX_PER_USER) {
        return res.status(429).json({ error: `You can keep ${MAX_PER_USER} logs` });
      }
      // Same id twice (a retry) does nothing instead of failing.
      const added = await db.insert(walletLogs).values(row).onConflictDoNothing().returning();
      if (added.length) await bus.emit('log.created', { userId: req.user.id, logs: added.map(toLog) });
      res.status(201).json({ log: toLog(row) });
    });

    // POST /api/wallet/logs/sync { logs: [...] } -> { logs } (everything saved, newest first)
    // Bad logs are skipped, not fatal, so one odd old entry can't block the rest.
    router.post('/logs/sync', async (req, res) => {
      const incoming = req.body?.logs;
      if (!Array.isArray(incoming) || incoming.length > MAX_SYNC) {
        return res.status(400).json({ error: `logs must be a list of up to ${MAX_SYNC}` });
      }
      const room = MAX_PER_USER - (await countFor(req.user.id));
      const rows = incoming.map((log) => toRow(req.user.id, log)).filter((row) => typeof row !== 'string').slice(0, Math.max(room, 0));
      const added = rows.length ? await db.insert(walletLogs).values(rows).onConflictDoNothing().returning() : [];
      if (added.length) await bus.emit('log.created', { userId: req.user.id, logs: added.map(toLog) });
      res.json({ logs: await listFor(req.user.id) });
    });

    // DELETE /api/wallet/logs/:id -> 204. Only ever your own (user_id is in the WHERE).
    router.delete('/logs/:id', async (req, res) => {
      await db.delete(walletLogs).where(and(eq(walletLogs.userId, req.user.id), eq(walletLogs.id, req.params.id)));
      res.status(204).end();
    });

    return router;
  },
};
