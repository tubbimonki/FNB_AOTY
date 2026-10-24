import { Link } from 'react-router-dom';
import { useLogs } from '../green-wallet/useLogs';
import { calculateTodayTotals } from '../green-wallet/totals';

// The row of three cards at the top of the dashboard. It does two jobs at
// once so the page needs no separate tab bar:
//  - it introduces what the app offers (news, guides, Green Wallet), and
//  - News and Guides switch the main column (?view=news / ?view=guides),
//    while Green Wallet takes you to the hands-on side of the app.
// aria-current="page" tells screen readers which view is showing; the same
// attribute drives the highlighted style.
//
// On wide screens (xl) the same list turns into a narrow rail stuck to the
// left edge: one column, moss background, square left corners so it looks
// attached to the side of the window, and sticky so it stays in view.
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
              to={`?view=${item.id}`}
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
