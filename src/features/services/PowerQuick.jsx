import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import Pill from '../../components/ui/Pill';
import { STATUS } from '../../components/ui/tones';
import { useApiData } from '../../hooks/useApiData';

// Small electricity card for the wide-screen side columns: status and the next
// planned outage, from the same /api/services/status as the Services page.
const PowerQuick = ({ className = '' }) => {
  const titleId = useId();
  const { status, data } = useApiData('/services/status');
  const power = data?.services.electricity;
  const look = STATUS[power?.status] ?? STATUS.unknown;
  const next = power?.schedule[0];

  return (
    <section aria-labelledby={titleId} className={`card ${className}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id={titleId} className="flex items-center gap-2 text-base"><Zap className="size-4 text-amber-600" aria-hidden="true" />Power</h2>
        <Link to="/services" className="text-sm font-semibold">Services →</Link>
      </div>
      {status === 'loading' && <p className="text-sm text-slate-500">Checking power status…</p>}
      {status === 'error' && <p className="text-sm text-slate-500">Power status is unavailable right now.</p>}
      {power && (
        <>
          <span className="flex flex-wrap gap-2">
            <Pill tone={look.tone}>{look.label}</Pill>
            {!data.live?.includes('electricity') && <Pill tone="gray">Demo data</Pill>}
          </span>
          <p className="mt-2 text-sm text-slate-600">{power.message}</p>
          {next && <p className="mt-2 text-sm"><span className="font-semibold">Next:</span> {next.when} · {next.what}</p>}
        </>
      )}
    </section>
  );
};

export default PowerQuick;
