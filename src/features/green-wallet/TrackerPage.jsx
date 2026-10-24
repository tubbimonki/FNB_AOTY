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
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Green Wallet</h2>
      <p className="mb-6 text-gray-700">Log the climate-friendly things you did and see what they saved.</p>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end mb-8">
        <label className="flex flex-col flex-1 min-w-60">
          <span className="text-sm font-semibold mb-1">What did you do?</span>
          <select
            value={actionId}
            onChange={(event) => setActionId(event.target.value)}
            className="border rounded p-2"
          >
            {actions.map((action) => (
              <option key={action.id} value={action.id}>{action.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-semibold mb-1">When?</span>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(event) => setDate(event.target.value)}
            className="border rounded p-2"
          />
        </label>

        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded px-4 py-2">
          Log it
        </button>
      </form>

      <section aria-label="Today" className="mb-8">
        <h3 className="text-xl font-bold mb-2">Today</h3>
        <p>
          {todayTotals.count} actions · {todayTotals.co2Kg.toFixed(1)} kg CO2 avoided · R{todayTotals.rand.toFixed(2)} saved
        </p>
      </section>

      <h3 className="text-xl font-bold mb-3">History</h3>
      {logs.length === 0 ? (
        <p className="text-gray-500">Nothing logged yet. Add your first action above.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => {
            const action = findAction(log.actionId);
            if (!action) return null;
            return (
              <li key={log.id} className="flex justify-between items-center border rounded p-3">
                <div>
                  <p className="font-semibold">{action.label}</p>
                  <p className="text-sm text-gray-600">
                    {log.date} · {action.co2Kg.toFixed(1)} kg CO2 · R{action.rand.toFixed(2)}
                  </p>
                </div>
                <button onClick={() => removeLog(log.id)} className="text-red-600 hover:underline">
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
