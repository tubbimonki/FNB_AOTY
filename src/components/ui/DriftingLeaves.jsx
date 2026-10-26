// A few leaves drifting down behind the hero text. Pure CSS animation
// (.leaf-drift in index.css); each leaf gets its own start point, size,
// speed and sway through CSS variables, so they never fall in step.
// Decorative: hidden from screen readers, ignores clicks, and the
// reduced-motion rule in index.css hides them.
// [left %, size px, seconds to fall, delay s, sideways sway px, colour]
const LEAVES = [
  [8, 18, 15, 0, 60, 'text-sprout/70'],
  [22, 12, 19, 5, -40, 'text-emerald-300/60'],
  [37, 20, 17, 9, 80, 'text-amber-300/60'],
  [55, 14, 21, 2, -70, 'text-sprout/50'],
  [68, 22, 16, 12, 50, 'text-emerald-200/60'],
  [81, 13, 20, 7, -60, 'text-amber-200/50'],
  [92, 17, 18, 14, 40, 'text-sprout/60'],
];

const DriftingLeaves = ({ className = '' }) => (
  <span aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
    {LEAVES.map(([left, size, duration, delay, sway, colour]) => (
      <svg
        key={left}
        viewBox="0 0 24 24"
        className={`leaf-drift ${colour}`}
        style={{ left: `${left}%`, width: size, height: size, '--fall': `${duration}s`, '--delay': `${delay}s`, '--sway': `${sway}px` }}
      >
        {/* A leaf: two curves meeting at the tip, plus a midrib. */}
        <path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill="currentColor" />
        <path d="M4 20 15 9" stroke="rgb(0 0 0 / 0.18)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ))}
  </span>
);

export default DriftingLeaves;
