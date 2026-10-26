import { Router } from 'express';
import { count, eq, sql } from 'drizzle-orm';
import { requireAuth } from '../../middleware/requireAuth.js';
import { computeImpact, POINTS } from '../../../shared/impact.js';
import { CHECKLIST } from '../../../shared/checklist.js';
import { DAILY_GOAL_L } from '../../../shared/water.js';
import { todaySA } from '../../../shared/checks.js';
import { walletLogs } from '../wallet/schema.js';
import { footprints, waterLogs } from '../eco/schema.js';
import { checklistTicks } from '../alerts/schema.js';

// Eco-points, level and badges, worked out from what the user saved.
// It only READS the other modules' tables, with the same maths as the page.
// TODO(events): once the event bus exists, listen for log.created etc. and
// keep an impact_points table instead, so this module owns its data.
export default {
  name: 'impact',
  events: { emits: ['badge.unlocked'], listens: ['log.created', 'water.logged', 'report.created', 'footprint.saved'] },

  router({ db, jwtSecret }) {
    const router = Router();

    // GET /api/impact/me -> { points, level, title, nextAt, badges, co2Kg, rand }
    router.get('/me', requireAuth({ db, jwtSecret }), async (req, res) => {
      const me = req.user.id;
      const today = todaySA();
      // Four small queries at once. GROUP BY does the counting in Postgres.
      const [byCategory, waterDays, ticks, footprint] = await Promise.all([
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
      });
      res.json({
        ...impact,
        co2Kg: byCategory.reduce((sum, g) => sum + g.co2Kg, 0),
        rand: byCategory.reduce((sum, g) => sum + g.rand, 0),
      });
    });

    return router;
  },
};
