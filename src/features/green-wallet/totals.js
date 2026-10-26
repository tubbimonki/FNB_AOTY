import { findAction } from './actions';

// Pure functions (no React), so they're easy to test and reuse in the dashboard.
// Logs whose action no longer exists are skipped instead of crashing.

// Today's local date as "YYYY-MM-DD", the format logs and <input type="date"> use.
// (toISOString would give the UTC date, which is yesterday before 02:00 in SA.)
export const today = () => new Date().toLocaleDateString('en-CA');

export const calculateTodayTotals = (logs) => calculateTotals(logs.filter((log) => log.date === today()));

export function calculateTotals(logs) {
  return logs.reduce(
    (totals, log) => {
      const action = findAction(log.actionId);
      if (!action) return totals;
      return {
        count: totals.count + 1,
        co2Kg: totals.co2Kg + action.co2Kg,
        rand: totals.rand + action.rand,
      };
    },
    { count: 0, co2Kg: 0, rand: 0 },
  );
}

// { '2026-10-24': { count, co2Kg, rand }, ... } for charts.
export function calculateTotalsByDate(logs) {
  const byDate = {};
  for (const log of logs) {
    (byDate[log.date] ??= []).push(log);
  }
  return Object.fromEntries(
    Object.entries(byDate).map(([date, dayLogs]) => [date, calculateTotals(dayLogs)]),
  );
}

// --- Goals and the weekly view -------------------------------------------

// What a "full ring" means for one day. The week view uses seven times this.
// Rough targets: ~5 kg is a geyser day plus a beef swap; tune them freely.
export const DAILY_GOALS = { co2Kg: 5, rand: 50, count: 3 };

// Ring colours, outer to inner. Checked with a palette validator for
// colour-blind separation and 3:1 contrast on the forest-900 card. They live
// here, not in ProgressRings.jsx, because Vite's fast refresh wants component
// files to export only components.
export const RING_COLORS = {
  co2Kg: '#3e9a52', // leaf green
  count: '#3f86d0', // sky blue
  rand: '#c27f1a',  // gold, for money
};

export const goalsFor = (period) => {
  const days = period === 'week' ? 7 : 1;
  return {
    co2Kg: DAILY_GOALS.co2Kg * days,
    rand: DAILY_GOALS.rand * days,
    count: DAILY_GOALS.count * days,
  };
};

// Move a "YYYY-MM-DD" date by a number of days (negative goes back).
// new Date(y, m - 1, d) is local midnight, so we never cross into UTC.
export function addDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day + days).toLocaleDateString('en-CA');
}

// The last n dates, oldest first, ending on `end` (today by default).
export const lastDays = (n, end = today()) =>
  Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));

// Totals for today or for the 7 days ending today (a rolling week, so the
// rings never reset to empty on a Monday morning).
export function calculatePeriodTotals(logs, period, end = today()) {
  const dates = new Set(period === 'week' ? lastDays(7, end) : [end]);
  return calculateTotals(logs.filter((log) => dates.has(log.date)));
}

// How many days in a row have at least one log. A day with nothing logged
// yet doesn't break the streak until it is over, so we start from yesterday
// when today is still empty.
export function calculateStreak(logs, end = today()) {
  const logged = new Set(logs.map((log) => log.date));
  let day = logged.has(end) ? end : addDays(end, -1);
  let streak = 0;
  while (logged.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
