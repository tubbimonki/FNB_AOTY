// A pill-shaped switch between views (Current / Forecast / Alerts).
// Buttons with aria-pressed, the same pattern as the Green Wallet toggle.
// options: [{ id, label }]. dark: the active pill is green instead of white.
const Segmented = ({ options, value, onChange, label, dark = false, className = '' }) => (
  <div role="group" aria-label={label} className={`flex rounded-full bg-slate-200/70 p-1 ${className}`}>
    {options.map((option) => {
      const active = option.id === value;
      return (
        <button
          key={option.id}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(option.id)}
          className={`min-h-10 flex-1 rounded-full px-3 text-sm font-semibold transition-colors ${
            active
              ? dark ? 'bg-forest-800 text-white shadow-sm' : 'bg-white text-forest-900 shadow-sm'
              : 'text-slate-600 hover:text-forest-900'
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export default Segmented;
