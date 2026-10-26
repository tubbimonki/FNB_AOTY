import { flushSync } from 'react-dom';

// Swap views with a soft cross-fade where the browser supports the View
// Transitions API (it snapshots the old screen, applies the change, then fades).
// flushSync makes React update the page inside that snapshot window.
const softly = (update) => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) return update();
  document.startViewTransition(() => flushSync(update));
};

// A pill-shaped switch between views (Current / Forecast / Alerts).
// Buttons with aria-pressed, the same pattern as the Green Wallet toggle.
// options: [{ id, label }]. dark: the active pill is green instead of white.
// The highlight is one shared "thumb" that slides under the chosen button.
const Segmented = ({ options, value, onChange, label, dark = false, className = '' }) => {
  const index = Math.max(0, options.findIndex((option) => option.id === value));

  return (
    <div role="group" aria-label={label} className={`relative flex rounded-full bg-slate-200/70 p-1 ${className}`}>
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 rounded-full shadow-sm transition-transform duration-(--motion-slow) ease-organic ${dark ? 'bg-forest-800' : 'bg-white'}`}
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => !active && softly(() => onChange(option.id))}
            className={`relative min-h-10 flex-1 rounded-full px-3 text-sm font-semibold transition-colors duration-(--motion-base) ${
              active
                ? dark ? 'text-white' : 'text-forest-900'
                : 'text-slate-600 hover:text-forest-900'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default Segmented;
