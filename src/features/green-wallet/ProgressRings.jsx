// Concentric progress rings (a "radial bar" chart), drawn with plain SVG.
//
// How one ring works: an SVG <circle> with a thick stroke and no fill. Its
// outline is 2 * PI * r long. stroke-dasharray="DRAWN GAP" paints the first
// DRAWN units of that outline and leaves the rest empty, so DRAWN = length *
// progress fills the ring from 0 to 100%. Circles start drawing at 3 o'clock,
// so the SVG is rotated -90deg to start at 12 like a clock.

const VIEWBOX = 100;

// rings: [{ key, label, value, goal, color }], outer ring first.
// children: whatever sits in the middle (the headline number).
export function ProgressRings({ rings, size = 200, stroke = 9, gap = 3, children }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Decorative: the legend next to it says the same in words. */}
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="-rotate-90" aria-hidden="true">
        {rings.map((ring, i) => {
          const r = VIEWBOX / 2 - stroke / 2 - i * (stroke + gap);
          return <Ring key={ring.key} r={r} stroke={stroke} progress={ring.value / ring.goal} color={ring.color} />;
        })}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
      )}
    </div>
  );
}

// One ring on its own, for the small per-day rings in the week strip.
export function MiniRing({ progress, color, size = 36, stroke = 12 }) {
  return (
    <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width={size} height={size} className="-rotate-90" aria-hidden="true">
      <Ring r={VIEWBOX / 2 - stroke / 2} stroke={stroke} progress={progress} color={color} />
    </svg>
  );
}

function Ring({ r, stroke, progress, color }) {
  const length = 2 * Math.PI * r;
  // Cap at a full ring; going past the goal is shown by the legend's tick.
  const drawn = length * Math.min(Math.max(progress || 0, 0), 1);
  return (
    <g fill="none" strokeWidth={stroke}>
      {/* The faint track shows where the ring is heading. */}
      <circle cx={VIEWBOX / 2} cy={VIEWBOX / 2} r={r} stroke={color} strokeOpacity={0.2} />
      {/* The progress arc. Always rendered so it can animate up from 0; a
          round cap on an empty arc would still draw a dot, hence "butt". */}
      <circle
        cx={VIEWBOX / 2}
        cy={VIEWBOX / 2}
        r={r}
        stroke={color}
        strokeLinecap={drawn > 0 ? 'round' : 'butt'}
        strokeDasharray={`${drawn} ${length}`}
        className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out"
      />
    </g>
  );
}
