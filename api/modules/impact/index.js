import { Router } from 'express';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { requireAuth } from '../../middleware/requireAuth.js';
import { computeImpact, POINTS } from '../../../shared/impact.js';
import { CHECKLIST } from '../../../shared/checklist.js';
import { DAILY_GOAL_L } from '../../../shared/water.js';
import { todaySA } from '../../../shared/checks.js';
import { walletLogs } from '../wallet/schema.js';
import { footprints, waterLogs } from '../eco/schema.js';
import { checklistTicks } from '../alerts/schema.js';
import { impactAwards, impactBadges } from './schema.js';
import { reactionEmoji } from '../../../shared/reactions.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const toAward = (row) => ({
  source: row.source,
  label: row.label,
  points: row.points,
  premiumDays: row.premiumDays,
  createdAt: row.createdAt.toISOString(),
});

// Premium runs from when it was won. Several weeks don't stack, the latest end wins.
export const premiumUntil = (awards) => {
  const ends = awards.filter((a) => a.premiumDays > 0).map((a) => new Date(a.createdAt).getTime() + a.premiumDays * DAY_MS);
  return ends.length ? new Date(Math.max(...ends)).toISOString() : null;
};

// Everything one member did, run through the shared points maths.
// Five small queries at once; GROUP BY does the counting in Postgres.
export async function impactFor(db, me) {
  const today = todaySA();
  const [byCategory, waterDays, ticks, footprint, awards] = await Promise.all([
    db
      .select({ category: walletLogs.category, n: count(), co2Kg: sql`sum(${walletLogs.co2Kg})`.mapWith(Number), rand: sql`sum(${walletLogs.rand})`.mapWith(Number) })
      .from(walletLogs)
      .where(eq(walletLogs.userId, me))
      .groupBy(walletLogs.category),
    db
      .select({ date: waterLogs.date, litres: sql`sum(${waterLogs.litres})`.mapWith(Number) })
      .from(waterLogs)
      .where(eq(waterLogs.userId, me))
      .groupBy(waterLogs.date),
    db.select({ itemId: checklistTicks.itemId }).from(checklistTicks).where(eq(checklistTicks.userId, me)),
    db.select({ n: count() }).from(footprints).where(eq(footprints.userId, me)),
    awardsOf(db, me),
  ]);

  // computeImpact wants one entry per log; only the category matters.
  const actionLogs = byCategory.flatMap((g) => Array.from({ length: g.n }, () => ({ category: g.category, points: POINTS.action })));
  const ticked = new Set(ticks.map((t) => t.itemId));
  const impact = computeImpact({
    actionLogs,
    // Same rule as the page: a finished day (not today) at or under the goal.
    waterDaysUnderGoal: waterDays.filter((d) => d.date < today && d.litres <= DAILY_GOAL_L).length,
    checklistDone: CHECKLIST.every((item) => ticked.has(item.id)),
    footprintDone: footprint[0].n > 0,
    bonusPoints: awards.reduce((sum, a) => sum + a.points, 0),
  });
  return {
    ...impact,
    co2Kg: byCategory.reduce((sum, g) => sum + g.co2Kg, 0),
    rand: byCategory.reduce((sum, g) => sum + g.rand, 0),
    awards,
    premiumUntil: premiumUntil(awards),
  };
}

const awardsOf = async (db, me) =>
  (await db.select().from(impactAwards).where(eq(impactAwards.userId, me)).orderBy(desc(impactAwards.createdAt))).map(toAward);

// After anything that can earn points: save newly reached badges and levels,
// and announce each one once on the bus ('badge.unlocked').
async function checkBadges(db, bus, userId) {
  const impact = await impactFor(db, userId);
  const reached = [
    ...impact.badges.filter((b) => b.unlocked).map((b) => ({ badge: b.id, label: b.label })),
    ...(impact.level > 1 ? [{ badge: `level-${impact.level}`, label: impact.title, level: impact.level }] : []),
  ];
  if (!reached.length) return;
  const added = await db
    .insert(impactBadges)
    .values(reached.map(({ badge }) => ({ userId, badge })))
    .onConflictDoNothing()
    .returning();
  for (const row of added) {
    await bus.emit('badge.unlocked', { userId, ...reached.find((r) => r.badge === row.badge) });
  }
}

// Eco-points, level and badges, worked out from what the user saved.
// It READS the other modules' tables (one source of truth for logs), with the
// same maths as the page. Rewards come in over the bus: going to an event,
// reacting, reporting a problem. Every event that can earn points also
// triggers a badge check, which announces 'badge.unlocked' for the bell.
export default {
  name: 'impact',
  events: {
    emits: ['badge.unlocked'],
    listens: ['event.attended', 'event.cancelled', 'reaction.added', 'reaction.removed', 'report.created', 'log.created', 'water.logged', 'footprint.saved', 'checklist.saved'],
  },

  // Called once at start with the bus.
  subscribe({ db, bus }) {
    const check = (userId) => checkBadges(db, bus, userId);

    bus.on('event.attended', async ({ userId, eventId, title, reward }) => {
      await db
        .insert(impactAwards)
        .values({ userId, source: `event:${eventId}`, label: `Going to ${title}`, points: reward.points, premiumDays: reward.premiumDays })
        .onConflictDoNothing();
      await check(userId);
    });
    bus.on('event.cancelled', async ({ userId, eventId }) => {
      await db.delete(impactAwards).where(and(eq(impactAwards.userId, userId), eq(impactAwards.source, `event:${eventId}`)));
    });
    // A couple of points for cheering an event on. Taking the reaction back takes them back.
    bus.on('reaction.added', async ({ userId, eventId, reaction }) => {
      await db
        .insert(impactAwards)
        .values({ userId, source: `reaction:${eventId}:${reaction}`, label: `Reacted ${reactionEmoji(reaction)} to an event`, points: POINTS.reaction })
        .onConflictDoNothing();
      await check(userId);
    });
    bus.on('reaction.removed', async ({ userId, eventId, reaction }) => {
      await db.delete(impactAwards).where(and(eq(impactAwards.userId, userId), eq(impactAwards.source, `reaction:${eventId}:${reaction}`)));
    });
    // A few points for reporting a problem on the map.
    bus.on('report.created', async ({ userId, reportId, category }) => {
      await db
        .insert(impactAwards)
        .values({ userId, source: `report:${reportId}`, label: `Reported: ${category}`, points: POINTS.report })
        .onConflictDoNothing();
      await check(userId);
    });
    // Logs and answers already live in their own modules' tables; only check badges.
    for (const name of ['log.created', 'water.logged', 'footprint.saved', 'checklist.saved']) {
      bus.on(name, ({ userId }) => check(userId));
    }
  },

  router({ db, jwtSecret }) {
    const router = Router();
    const auth = requireAuth({ db, jwtSecret });

    // GET /api/impact/awards -> { awards, points, premiumUntil }
    router.get('/awards', auth, async (req, res) => {
      const awards = await awardsOf(db, req.user.id);
      res.json({ awards, points: awards.reduce((sum, a) => sum + a.points, 0), premiumUntil: premiumUntil(awards) });
    });

    // GET /api/impact/me -> { points, level, title, nextAt, badges, co2Kg, rand, awards, premiumUntil }
    router.get('/me', auth, async (req, res) => {
      res.json(await impactFor(db, req.user.id));
    });

    return router;
  },
};
