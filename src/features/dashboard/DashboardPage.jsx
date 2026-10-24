import { useLogs } from '../green-wallet/useLogs';
import { calculateTotals } from '../green-wallet/totals';

// PLACEHOLDER dashboard. The data is real (same logs as Green Wallet);
// layout, charts and styling are still to do.
const DashboardPage = () => {
  const { logs } = useLogs();
  const totals = calculateTotals(logs);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      {/* TODO(dashboard): stat cards */}
      <section>
        <p>Actions logged: {totals.count}</p>
        <p>CO2 avoided: {totals.co2Kg.toFixed(1)} kg</p>
        <p>Money saved: R{totals.rand.toFixed(2)}</p>
      </section>

      {/* TODO(dashboard): weekly chart, e.g. totals per day from calculateTotalsByDate(logs) */}
    </main>
  );
};

export default DashboardPage;
