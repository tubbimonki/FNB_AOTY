import { lastDays, today } from '../green-wallet/totals';
import { DAILY_GOAL_L } from '../../../shared/water';

export { DAILY_GOAL_L, SA_AVERAGE_L } from '../../../shared/water';

// One-tap amounts. Rough household figures; tune them for your own taps.
export const WATER_USES = [
  { id: 'shower', label: '5 min shower', litres: 45 },
  { id: 'toilet', label: 'Toilet flush', litres: 9 },
  { id: 'bath', label: 'Bath', litres: 80 },
  { id: 'laundry', label: 'Laundry load', litres: 70 },
  { id: 'dishes', label: 'Dishes by hand', litres: 20 },
  { id: 'drink', label: 'Drinking & cooking', litres: 5 },
  { id: 'garden', label: '10 min garden hose', litres: 150 },
];

// { '2026-10-25': 68, ... }
export function litresByDate(logs) {
  const byDate = {};
  for (const log of logs) byDate[log.date] = (byDate[log.date] ?? 0) + log.litres;
  return byDate;
}

// The last 7 days, oldest first: [{ date, litres }]
export const lastWeek = (logs, end = today()) => {
  const byDate = litresByDate(logs);
  return lastDays(7, end).map((date) => ({ date, litres: byDate[date] ?? 0 }));
};

// Days that have logs and stayed at or under the goal (today counts only once
// it's over, so you can't "win" it at breakfast).
export function daysUnderGoal(logs, goal = DAILY_GOAL_L, end = today()) {
  return Object.entries(litresByDate(logs)).filter(([date, litres]) => date < end && litres <= goal).length;
}
