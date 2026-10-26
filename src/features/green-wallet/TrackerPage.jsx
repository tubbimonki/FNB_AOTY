import { useState } from 'react';
import { findAction } from './actions';
import { useLogs } from './useLogs';
import {
  DAILY_GOALS,
  RING_COLORS,
  calculatePeriodTotals,
  calculateStreak,
  calculateTotalsByDate,
  goalsFor,
  lastDays,
  today,
} from './totals';
import { MiniRing, ProgressRings } from './ProgressRings';
import ActionPicker from './ActionPicker';

const PERIODS = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This week' },
];

// "2026-10-24" -> a Date at local midnight, for weekday and month names.
const toDate = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const dayHeading = (date) => {
  if (date === today()) return 'Today';
  if (date === lastDays(2)[0]) return 'Yesterday';
  return toDate(date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
};

const summary = (totals) =>
  `${totals.count} ${totals.count === 1 ? 'action' : 'actions'} · ${totals.co2Kg.toFixed(1)} kg CO2 · R${totals.rand.toFixed(2)}`;

const TrackerPage = () => {
  // Each log only stores the action's id and the date; we look up the CO2 and
  // rand when we need them. useLogs saves them (Postgres + this browser).
  const { logs, addLog, removeLog } = useLogs();
  const [period, setPeriod] = useState('day');
  const [lastLogged, setLastLogged] = useState(null);

  // Everything below is derived from `logs` on each render instead of being
  // kept in state, so it can never go stale.
  const totals = calculatePeriodTotals(logs, period);
  const goals = goalsFor(period);
  const rings = [
    { key: 'co2Kg', label: 'CO2 avoided', value: totals.co2Kg, goal: goals.co2Kg, format: (n) => `${n.toFixed(1)} kg` },
    { key: 'count', label: 'Actions', value: totals.count, goal: goals.count, format: (n) => `${n}` },
    { key: 'rand', label: 'Money saved', value: totals.rand, goal: goals.rand, format: (n) => `R${n.toFixed(2)}` },
  ].map((ring) => ({ ...ring, color: RING_COLORS[ring.key] }));

  const week = lastDays(7);
  const byDate = calculateTotalsByDate(logs);
  const streak = calculateStreak(logs);
  const weekTotals = calculatePeriodTotals(logs, 'week');

  // History grouped by day, newest day first (skipping days whose only logs
  // point at actions that no longer exist).
  const historyDates = Object.keys(byDate)
    .filter((date) => byDate[date].count > 0)
    .sort()
    .reverse();

  const handleLog = (actionId, date) => {
    addLog(actionId, date);
    setLastLogged(findAction(actionId)?.label);
  };

  return (
    <main className="page max-w-2xl">
      <h1 className="page-title">Green Wallet</h1>
      <p className="page-intro">Log the climate-friendly things you did and watch your rings fill up.</p>

      <section aria-labelledby="rings-title" className="mb-6 rounded-2xl bg-forest-900 p-5 text-white sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="rings-title" className="text-xl text-white">
            {period === 'day' ? "Today's progress" : 'Last 7 days'}
          </h2>
          {/* A two-option toggle. aria-pressed tells screen readers which is on. */}
          <div className="flex rounded-full bg-forest-800 p-1" role="group" aria-label="Show totals for">
            {PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={period === option.id}
                onClick={() => setPeriod(option.id)}
                className={`min-h-9 rounded-full px-4 text-sm font-semibold ${
                  period === option.id ? 'bg-white text-forest-900' : 'text-forest-100 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 flex flex-col items-center gap-6 sm:flex-row">
          <ProgressRings rings={rings} size={200}>
            <span className="text-3xl font-bold">{totals.co2Kg.toFixed(1)}</span>
            <span className="text-xs text-forest-200">kg CO2</span>
          </ProgressRings>

          {/* The legend doubles as the text version of the chart. */}
          <dl className="w-full space-y-3">
            {rings.map((ring) => {
              const percent = Math.round((ring.value / ring.goal) * 100);
              return (
                <div key={ring.key} className="flex items-center gap-3">
                  <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: ring.color }} />
                  <dt className="flex-1 text-sm text-forest-100">{ring.label}</dt>
                  <dd className="text-right">
                    <span className="font-bold">{ring.format(ring.value)}</span>
                    <span className="text-sm text-forest-200"> / {ring.format(ring.goal)}</span>
                    <span className="ml-2 inline-block w-14 whitespace-nowrap text-sm text-forest-200">
                      {percent >= 100 ? '✓ done' : `${percent}%`}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <ActionPicker onLog={handleLog} />
        {/* aria-live announces the change to screen readers without moving focus. */}
        <p aria-live="polite" className="mt-3 min-h-5 text-sm text-forest-200">
          {lastLogged && `Logged: ${lastLogged}`}
        </p>
      </section>

      <section aria-labelledby="week-title" className="card mb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="week-title" className="text-lg">Your week</h2>
          <p className="text-sm text-forest-700/80">
            {streak > 0 ? `${streak}-day streak · ` : ''}
            {weekTotals.co2Kg.toFixed(1)} kg this week
          </p>
        </div>
        {/* One small ring per day: CO2 avoided against the daily goal. */}
        <ol className="grid grid-cols-7 gap-1 text-center">
          {week.map((date) => {
            const day = byDate[date] ?? { count: 0, co2Kg: 0, rand: 0 };
            const weekday = toDate(date).toLocaleDateString('en-ZA', { weekday: 'short' });
            const isToday = date === today();
            return (
              <li key={date} title={`${dayHeading(date)}: ${summary(day)}`} className="flex flex-col items-center gap-1">
                <MiniRing progress={day.co2Kg / DAILY_GOALS.co2Kg} color={RING_COLORS.co2Kg} />
                <span className={`text-xs ${isToday ? 'font-bold text-forest-900' : 'text-forest-700/80'}`}>
                  {weekday}
                </span>
                <span className="sr-only">{`${day.co2Kg.toFixed(1)} kg CO2`}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <h2 className="mb-3 text-xl">History</h2>
      {logs.length === 0 ? (
        <p className="text-forest-700/70">Nothing logged yet. Tap "Log an action" above to start.</p>
      ) : (
        <div className="space-y-5">
          {historyDates.map((date) => (
            <section key={date} aria-label={dayHeading(date)}>
              <h3 className="mb-2 flex flex-wrap justify-between gap-x-3 text-base">
                <span>{dayHeading(date)}</span>
                <span className="text-sm font-normal text-forest-700/80">{summary(byDate[date])}</span>
              </h3>
              <ul className="space-y-2">
                {logs
                  .filter((log) => log.date === date)
                  .map((log) => {
                    const action = findAction(log.actionId);
                    if (!action) return null;
                    return (
                      <li key={log.id} className="card flex items-center justify-between gap-3 p-3 sm:p-4">
                        <div className="min-w-0">
                          <p className="font-semibold">{action.label}</p>
                          <p className="text-sm text-forest-700/80">
                            {action.co2Kg.toFixed(1)} kg CO2 · R{action.rand.toFixed(2)}
                          </p>
                        </div>
                        {/* Every button reads "Delete", so the label says which entry it removes. */}
                        <button
                          onClick={() => removeLog(log.id)}
                          aria-label={`Delete "${action.label}" on ${log.date}`}
                          className="min-h-11 shrink-0 rounded-md px-3 text-sm text-bark hover:bg-forest-50 hover:underline"
                        >
                          Delete
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
};

export default TrackerPage;
