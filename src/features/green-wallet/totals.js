import { findAction } from './actions';

// Pure functions (no React), so they're easy to test and reuse in the dashboard.
// Logs whose action no longer exists are skipped instead of crashing.

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
