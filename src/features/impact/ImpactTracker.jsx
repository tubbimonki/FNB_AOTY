import { useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, Leaf, RefreshCw, X } from 'lucide-react';
import { useImpact } from './useImpact';
import { compare } from './comparisons';

// Pages where the tracker would get in the way (the splash and the forms).
const HIDDEN_ON = ['/home', '/login', '/register'];

const Counter = ({ value, label }) => (
  <div className="rounded-xl bg-forest-50 px-2 py-2 text-center">
    {/* key restarts the pop each time the number changes */}
    <span key={value} className="block text-lg font-bold text-forest-900 motion-safe:animate-pop">{value}</span>
    <span className="block text-[11px] leading-tight text-slate-600">{label}</span>
  </div>
);

// The little leaf in the corner of every page. Hover (or tap on a phone)
// to open your running totals from Green Wallet, plus a sourced comparison
// that puts the CO2 number in everyday terms. Logging an action updates it
// straight away, and for members the server's own count takes over once
// the logs are saved (impact listens for 'log.created' on the bus).
const ImpactTracker = () => {
  const { pathname } = useLocation();
  const impact = useImpact();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false); // opened by a click or tap, stays open
  const [pick, setPick] = useState(0);
  const panelId = useId();
  if (HIDDEN_ON.includes(pathname)) return null;

  const co2Kg = impact.actionLogs.reduce((sum, log) => sum + log.action.co2Kg, 0);
  const rand = impact.actionLogs.reduce((sum, log) => sum + log.action.rand, 0);
  const fact = compare(co2Kg, pick);
  const open = hovered || pinned;

  // Hover peeks on a mouse; a click or tap pins it open (or closed again).
  const hover = (value) => (e) => e.pointerType === 'mouse' && setHovered(value);
  const close = () => {
    setPinned(false);
    setHovered(false);
  };

  return (
    <div
      className="fixed right-3 bottom-[calc(var(--spacing-tabbar)+0.75rem)] z-40 flex flex-col items-end gap-2 lg:right-6 lg:bottom-6"
      onPointerEnter={hover(true)}
      onPointerLeave={hover(false)}
    >
      {open && (
        <section id={panelId} aria-label="Your impact so far" className="w-72 rounded-2xl bg-white p-4 text-slate-800 shadow-xl ring-1 ring-black/5 motion-safe:animate-fade-in">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Your impact</p>
              <p className="font-bold text-forest-900">Level {impact.level} · {impact.title}</p>
            </div>
            <button type="button" onClick={close} aria-label="Close impact tracker" className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Counter value={impact.actionLogs.length} label="actions" />
            <Counter value={`${co2Kg.toFixed(1)} kg`} label="CO₂ avoided" />
            <Counter value={`R${Math.round(rand)}`} label="saved" />
          </div>

          {impact.actionLogs.length > 0 ? (
            <div className="mt-3 rounded-xl bg-sky-50 p-3 text-sm">
              <p>{fact.text}</p>
              <p className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                <a href={fact.url} target="_blank" rel="noopener noreferrer">Source: {fact.source}</a>
                <button type="button" onClick={() => setPick(pick + 1)} aria-label="Another comparison" className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-white">
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                </button>
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Log your first action to see what it adds up to.</p>
          )}

          {impact.premiumUntil && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Crown className="size-3.5" aria-hidden="true" />
              Premium until {new Date(impact.premiumUntil).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
            </p>
          )}

          <div className="mt-3 flex gap-2 text-sm">
            <Link to="/tracker" className="btn flex-1 justify-center py-1.5">Log an action</Link>
            <Link to="/impact" className="btn btn-light flex-1 justify-center py-1.5">Badges</Link>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setPinned(!pinned)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Your impact: ${impact.points} eco-points`}
        className="flex items-center gap-2 rounded-full bg-forest-900 py-2 pr-4 pl-3 font-semibold text-white shadow-lg ring-2 ring-white/70 transition-transform hover:scale-105 active:scale-95"
      >
        <Leaf className="size-5 text-sprout motion-safe:animate-leaf-sway" aria-hidden="true" />
        <span key={impact.points} className="motion-safe:animate-pop">{impact.points}</span>
        <span className="sr-only">eco-points</span>
      </button>
    </div>
  );
};

export default ImpactTracker;
