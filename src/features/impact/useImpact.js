import { computeImpact, POINTS } from '../../../shared/impact';
import { findAction } from '../green-wallet/actions';
import { useLogs } from '../green-wallet/useLogs';
import { lastDays } from '../green-wallet/totals';
import { useWaterLogs } from '../water/useWaterLogs';
import { daysUnderGoal } from '../water/water';
import { useChecklist } from '../alerts/useChecklist';
import { useFootprint } from '../eco/useFootprint';

// Gathers everything the user did (Postgres when logged in, see useSynced) and
// runs it through the shared points maths. GET /api/impact/me does the
// same on the server from the database.
export function useImpact() {
  const { logs } = useLogs();
  const water = useWaterLogs();
  const checklist = useChecklist();
  const { saved: footprint } = useFootprint();

  // Each log with its action, skipping logs whose action was removed.
  const actionLogs = logs
    .map((log) => ({ ...log, action: findAction(log.actionId) }))
    .filter((log) => log.action)
    .map((log) => ({ ...log, category: log.action.category, label: log.action.label, points: POINTS.action }));

  const impact = computeImpact({
    actionLogs,
    waterDaysUnderGoal: daysUnderGoal(water.logs),
    checklistDone: checklist.doneCount === checklist.total,
    footprintDone: Boolean(footprint),
  });

  // This week's points, which make the plant grow.
  const week = new Set(lastDays(7));
  const weekPoints =
    actionLogs.filter((log) => week.has(log.date)).length * POINTS.action +
    daysUnderGoal(water.logs.filter((log) => week.has(log.date))) * POINTS.waterDay;

  // Days since the last Green Wallet log (null if never), for a wilting plant.
  const lastDate = actionLogs.map((log) => log.date).sort().at(-1);
  const recent = new Set(lastDays(3));
  const wilting = Boolean(lastDate) && !recent.has(lastDate);

  return { ...impact, actionLogs, weekPoints, wilting, footprint, waterLogs: water.logs };
}
