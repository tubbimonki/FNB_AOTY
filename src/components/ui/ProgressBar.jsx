// A rounded progress bar. value and max are numbers; colour is a CSS colour.
// role="progressbar" lets screen readers read "68 percent".
const ProgressBar = ({ value, max, color = '#226842', label, className = '' }) => {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={`h-2.5 overflow-hidden rounded-full bg-slate-100 ${className}`}
    >
      <div
        className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700"
        style={{ width: `${percent}%`, background: color }}
      />
    </div>
  );
};

export default ProgressBar;
