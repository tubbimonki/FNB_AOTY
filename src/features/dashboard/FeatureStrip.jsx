import { Link } from 'react-router-dom';
import { useLogs } from '../green-wallet/useLogs';
import { calculateTodayTotals } from '../green-wallet/totals';

// The three cards at the top of the news and guides pages: News and Guides
// switch views (aria-current marks the current one), Green Wallet links to the
// tracker. From xl the same list becomes a sticky moss rail on the left edge.
const cardClass = (active) =>
  `flex h-full flex-col rounded-xl border p-3 no-underline transition-colors hover:no-underline sm:p-4 ${
    active
      ? 'border-forest-600 bg-forest-600 text-white'
      : 'border-forest-100 bg-white text-forest-900 hover:border-forest-300'
  }`;

const FeatureStrip = ({ view }) => {
  const { logs } = useLogs();
  const today = calculateTodayTotals(logs);

  const views = [
    { id: 'news', icon: '📰', label: 'News', blurb: "What's happening in climate" },
    { id: 'guides', icon: '📘', label: 'Guides', blurb: 'Practical how-tos, newest first' },
  ];

  return (
    <nav aria-label="Dashboard sections" className="xl:sticky xl:top-24 xl:rounded-r-xl xl:bg-moss xl:p-2 xl:shadow-sm">
      <ul className="grid grid-cols-3 gap-2 sm:gap-4 xl:grid-cols-1 xl:gap-2">
        {views.map((item) => (
          <li key={item.id}>
            <Link
              to={`/dashboard/${item.id}`}
              aria-current={view === item.id ? 'page' : undefined}
              className={cardClass(view === item.id)}
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
              <span className="hidden text-sm opacity-80 sm:block xl:hidden">{item.blurb}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link to="/tracker" className={cardClass(false)}>
            <span className="text-xl" aria-hidden="true">🌱</span>
            <span className="font-semibold">Green Wallet</span>
            <span className="text-sm opacity-80">
              {today.co2Kg.toFixed(1)} kg today<span className="hidden sm:inline xl:hidden"> · R{today.rand.toFixed(2)} saved</span>
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default FeatureStrip;
