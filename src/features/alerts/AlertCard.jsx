import { Link } from 'react-router-dom';
import { SEVERITY } from './severity';

// Our own pages open in the app, official sources in a new tab.
const MoreLink = ({ href, className }) =>
  href.startsWith('/') ? (
    <Link to={href} className={`mt-1 inline-block text-sm font-semibold ${className}`}>See status →</Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={`mt-1 inline-block text-sm font-semibold ${className}`}>Official warning →</a>
  );

// One alert. `compact` is the dashboard banner version with a link to the alerts page.
const AlertCard = ({ alert, compact = false }) => {
  const style = SEVERITY[alert.severity] ?? SEVERITY.info;
  const Icon = style.icon;
  const meta = [alert.when, alert.where, alert.source].filter(Boolean).join(' · ');

  return (
    <article className={`flex gap-3 rounded-2xl border p-4 shadow-sm ${style.card}`}>
      <Icon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-bold uppercase tracking-wide ${style.meta}`}>{style.label}{alert.sample && ' · Sample'}</p>
        <h3 className={`font-bold ${alert.severity === 'severe' ? 'text-white' : 'text-inherit'}`}>{alert.title}</h3>
        <p className="text-sm">{alert.body}</p>
        {meta && !compact && <p className={`mt-2 text-xs font-semibold ${style.meta}`}>{meta}</p>}
        {alert.href && !compact && <MoreLink href={alert.href} className={style.meta} />}
        {compact && (
          <Link to="/alerts" className={`mt-2 inline-block text-sm font-semibold ${alert.severity === 'severe' ? 'text-white' : 'text-inherit'}`}>
            View details →
          </Link>
        )}
      </div>
    </article>
  );
};

export default AlertCard;
