import { useState } from 'react';
import { actions, findAction } from './actions';
import { useLogs } from './useLogs';
import { calculateTotals } from './totals';

// Today's local date as "YYYY-MM-DD", the format an <input type="date"> uses.
// (toISOString would give the UTC date, which is yesterday before 02:00 in SA.)
const today = () => new Date().toLocaleDateString('en-CA');

const TrackerPage = () => {
  // Each log only stores the action's id and the date; we look up the CO2 and
  // rand when we need them. useLogs keeps them in localStorage.
  const { logs, addLog, removeLog } = useLogs();
  const todayTotals = calculateTotals(logs.filter((log) => log.date === today()));

  // The form's current values. These are "controlled inputs": React state is
  // the source of truth, and each input shows the state and updates it on change.
  const [actionId, setActionId] = useState(actions[0].id);
  const [date, setDate] = useState(today());

  const handleSubmit = (event) => {
    event.preventDefault(); // stop the browser reloading the page on submit
    addLog(actionId, date);
  };

  return (
    <main className="page max-w-2xl">
      <h2 className="page-title">Green Wallet</h2>
      <p className="page-intro">Log the climate-friendly things you did and see what they saved.</p>

      <form onSubmit={handleSubmit} className="card mb-8 flex flex-wrap items-end gap-3">
        <label className="flex flex-col flex-1 min-w-60">
          <span className="label">What did you do?</span>
          <select
            value={actionId}
            onChange={(event) => setActionId(event.target.value)}
            className="input"
          >
            {actions.map((action) => (
              <option key={action.id} value={action.id}>{action.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="label">When?</span>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(event) => setDate(event.target.value)}
            className="input"
          />
        </label>

        <button type="submit" className="btn">
          Log it
        </button>
      </form>

      <section aria-label="Today" className="mb-8 rounded-xl bg-forest-800 p-5 text-white">
        <h3 className="mb-2 text-xl text-white">Today</h3>
        <p className="text-forest-100">
          {todayTotals.count} actions · {todayTotals.co2Kg.toFixed(1)} kg CO2 avoided · R{todayTotals.rand.toFixed(2)} saved
        </p>
      </section>

      <h3 className="mb-3 text-xl">History</h3>
      {logs.length === 0 ? (
        <p className="text-forest-700/70">Nothing logged yet. Add your first action above.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => {
            const action = findAction(log.actionId);
            if (!action) return null;
            return (
              <li key={log.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{action.label}</p>
                  <p className="text-sm text-forest-700/80">
                    {log.date} · {action.co2Kg.toFixed(1)} kg CO2 · R{action.rand.toFixed(2)}
                  </p>
                </div>
                <button onClick={() => removeLog(log.id)} className="text-sm text-bark hover:underline">
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};

export default TrackerPage;
