import { Link } from 'react-router-dom';
import { useLogs } from './useLogs';
import { calculateTodayTotals } from './totals';

// Small Green Wallet card for the sidebar of the news and guides pages: today's totals and a
// link to the full tracker. It reads the logs itself (useLogs), so any page
// can drop it in without passing data down.
const WalletSummary = ({ className = '' }) => {
  const { logs } = useLogs();
  const totals = calculateTodayTotals(logs);

  return (
    <section aria-labelledby="wallet-summary-title" className={`rounded-xl bg-forest-800 p-5 text-white ${className}`}>
      <h2 id="wallet-summary-title" className="mb-3 text-lg text-white">Green Wallet today</h2>
      <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-xs text-forest-200">Actions</dt>
          <dd className="text-xl font-bold">{totals.count}</dd>
        </div>
        <div>
          <dt className="text-xs text-forest-200">CO2 avoided</dt>
          <dd className="text-xl font-bold">{totals.co2Kg.toFixed(1)} kg</dd>
        </div>
        <div>
          <dt className="text-xs text-forest-200">Saved</dt>
          <dd className="text-xl font-bold">R{totals.rand.toFixed(2)}</dd>
        </div>
      </dl>
      <Link to="/tracker" className="btn btn-light w-full">
        {totals.count === 0 ? 'Log your first action' : 'Log another action'}
      </Link>
    </section>
  );
};

export default WalletSummary;
