import Pill from '../../components/ui/Pill';

const NAMES = { weather: 'Weather', power: 'Power', air: 'Air quality', saws: 'SAWS warnings' };
const LOOK = {
  live: ['green', 'live'],
  stale: ['amber', 'last known'],
  unavailable: ['red', 'unreachable'],
  off: ['gray', 'off'],
};

// One line saying where the alerts come from, so sample data is never mistaken for real.
const SourceStatus = ({ apiStatus, sample, sources }) => {
  if (apiStatus === 'loading') return <p className="text-sm text-slate-500">Checking live alert sources…</p>;
  if (apiStatus === 'error') {
    return <p className="text-sm text-slate-600"><Pill tone="amber">Offline</Pill> The alerts service can't be reached, so only forecast warnings are shown.</p>;
  }
  if (sample) {
    return <p className="text-sm text-slate-600"><Pill tone="gray">Sample data</Pill> No live alert source answered. These are examples, not real alerts.</p>;
  }
  return (
    <ul aria-label="Alert sources" className="flex flex-wrap gap-2 text-sm">
      {Object.entries(sources ?? {}).map(([key, status]) => {
        const [tone, label] = LOOK[status] ?? LOOK.off;
        return <li key={key}><Pill tone={tone}>{NAMES[key] ?? key}: {label}</Pill></li>;
      })}
    </ul>
  );
};

export default SourceStatus;
