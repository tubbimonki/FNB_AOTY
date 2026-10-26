// Eco-points, levels and badges for the "Your Impact" page (frontend) and
// GET /api/impact/me (backend). Pure JS so both can load it.

export const POINTS = {
  action: 10,          // each Green Wallet log
  waterDay: 20,        // each day under the water goal
  checklist: 50,       // emergency checklist fully done
  footprint: 100,      // footprint questionnaire done
};

export const POINTS_PER_LEVEL = 500;
export const LEVEL_TITLES = ['Seedling', 'Climate Hero', 'Green Guardian', 'Community Champion', 'Earth Keeper'];

// Each badge: how far along you are (have) and what unlocks it (need).
const BADGES = [
  { id: 'water-saver', label: 'Water Saver', need: 3, have: (s) => s.waterDaysUnderGoal, hint: 'Stay under your water goal on 3 days' },
  { id: 'recycling-champ', label: 'Recycling Champ', need: 5, have: (s) => s.countBy.waste ?? 0, hint: 'Log 5 recycling or clean-up actions' },
  { id: 'green-commuter', label: 'Green Commuter', need: 5, have: (s) => s.countBy.travel ?? 0, hint: 'Log 5 walking, cycling or lift-club trips' },
  { id: 'prepared', label: 'Prepared', need: 1, have: (s) => (s.checklistDone ? 1 : 0), hint: 'Finish the emergency checklist' },
  { id: 'footprint', label: 'Footprint Finder', need: 1, have: (s) => (s.footprintDone ? 1 : 0), hint: 'Work out your carbon footprint' },
];

// stats: { actionLogs: [{ category }], waterDaysUnderGoal, checklistDone, footprintDone, bonusPoints }
// bonusPoints: rewards won elsewhere, e.g. for going to a community event.
export function computeImpact({ actionLogs = [], waterDaysUnderGoal = 0, checklistDone = false, footprintDone = false, bonusPoints = 0 } = {}) {
  const countBy = {};
  for (const log of actionLogs) countBy[log.category] = (countBy[log.category] ?? 0) + 1;
  const stats = { countBy, waterDaysUnderGoal, checklistDone, footprintDone };

  const points =
    actionLogs.length * POINTS.action +
    waterDaysUnderGoal * POINTS.waterDay +
    (checklistDone ? POINTS.checklist : 0) +
    (footprintDone ? POINTS.footprint : 0) +
    bonusPoints;

  const levelIndex = Math.min(Math.floor(points / POINTS_PER_LEVEL), LEVEL_TITLES.length - 1);
  const nextAt = (levelIndex + 1) * POINTS_PER_LEVEL;

  return {
    points,
    level: levelIndex + 1,
    title: LEVEL_TITLES[levelIndex],
    nextAt,
    nextTitle: LEVEL_TITLES[levelIndex + 1] ?? null,
    badges: BADGES.map((b) => {
      const have = Math.min(b.have(stats), b.need);
      return { id: b.id, label: b.label, hint: b.hint, have, need: b.need, unlocked: have >= b.need };
    }),
  };
}
