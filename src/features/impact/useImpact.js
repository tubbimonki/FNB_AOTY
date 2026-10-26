import { useEffect, useState } from 'react';
import { computeImpact, POINTS } from '../../../shared/impact';
import { apiGet } from '../../services/api';
import { useAuth } from '../auth/useAuth';
import { findAction } from '../green-wallet/actions';
import { useLogs } from '../green-wallet/useLogs';
import { lastDays } from '../green-wallet/totals';
import { useWaterLogs } from '../water/useWaterLogs';
import { daysUnderGoal } from '../water/water';
import { useChecklist } from '../alerts/useChecklist';
import { useFootprint } from '../eco/useFootprint';
import { useAwards } from './useAwards';

// GET /api/impact/me for `version`, or null until it answers (or if it fails).
// version changes whenever the user's data does, so the server is asked again
// and an answer about older data is never shown.
function useServerImpact(version) {
  const [result, setResult] = useState({ version: null, data: null });

  useEffect(() => {
    if (version === null) return undefined;
    let ignore = false;
    apiGet('/impact/me')
      .then((data) => !ignore && setResult({ version, data }))
      .catch(() => {}); // offline: the browser's numbers stand
    return () => {
      ignore = true;
    };
  }, [version]);

  return version !== null && result.version === version ? result.data : null;
}

// Gathers everything the user did (Postgres when logged in, see useSynced) and
// runs it through the shared points maths. For members whose logs are all
// saved, the score comes from GET /api/impact/me instead: the database is the
// record rewards are based on, and every device then shows the same number.
// Guests, offline visits and unsynced logs use the browser's own count.
// source says which one is showing: 'server' or 'browser'.
export function useImpact() {
  const { user } = useAuth();
  const { logs } = useLogs();
  const water = useWaterLogs();
  const checklist = useChecklist();
  const { saved: footprint, pending: footprintPending } = useFootprint();
  const { awards, premiumUntil } = useAwards(); // event rewards, from the server
  const awardPoints = awards.reduce((sum, a) => sum + a.points, 0);

  // Each log with its action, skipping logs whose action was removed.
  const actionLogs = logs
    .map((log) => ({ ...log, action: findAction(log.actionId) }))
    .filter((log) => log.action)
    .map((log) => ({ ...log, category: log.action.category, label: log.action.label, points: POINTS.action }));

  const local = computeImpact({
    actionLogs,
    waterDaysUnderGoal: daysUnderGoal(water.logs),
    checklistDone: checklist.doneCount === checklist.total,
    footprintDone: Boolean(footprint),
    bonusPoints: awardPoints,
  });

  const allSaved = logs.every((log) => log.synced) && water.logs.every((log) => log.synced) && !checklist.pending && !footprintPending;
  const version = user && allSaved ? [user.id, logs.length, water.logs.length, checklist.doneCount, footprint?.savedAt ?? 0, awardPoints].join(':') : null;
  const server = useServerImpact(version);
  const { points, level, title, nextAt, nextTitle, badges } = server ?? local;
  const impact = { points, level, title, nextAt, nextTitle, badges, source: server ? 'server' : 'browser' };

  // This week's points, which make the plant grow.
  const week = new Set(lastDays(7));
  const weekPoints =
    actionLogs.filter((log) => week.has(log.date)).length * POINTS.action +
    daysUnderGoal(water.logs.filter((log) => week.has(log.date))) * POINTS.waterDay +
    awards.filter((a) => week.has(a.createdAt.slice(0, 10))).reduce((sum, a) => sum + a.points, 0);

  // Days since the last Green Wallet log (null if never), for a wilting plant.
  const lastDate = actionLogs.map((log) => log.date).sort().at(-1);
  const recent = new Set(lastDays(3));
  const wilting = Boolean(lastDate) && !recent.has(lastDate);

  return { ...impact, actionLogs, weekPoints, wilting, footprint, waterLogs: water.logs, awards, premiumUntil };
}
