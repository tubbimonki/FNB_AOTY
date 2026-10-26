// A little plant that grows when it scrolls into view: the stem draws itself,
// then the leaves unfold one after another, then the flower opens.
// The animation lives in index.css (.grow-plant); useScrollReveal starts it
// by switching data-reveal from "wait" to "in". Colours are the leaf, sun and
// blossom tones from index.css, written out so the drawing never depends on
// Tailwind classes.
const GrowingSprout = ({ className = '' }) => (
  <svg viewBox="0 0 120 160" aria-hidden="true" focusable="false" data-reveal className={`grow-plant ${className}`}>
    {/* Soil */}
    <ellipse cx="60" cy="150" rx="42" ry="7" fill="rgb(108 63 28 / 0.25)" />
    {/* Stem: pathLength=1 lets CSS draw it from 0 to 1 whatever its real length. */}
    <path className="grow-stem" stroke="#477229" d="M60 150C60 120 54 100 62 70S60 35 60 30" pathLength="1" fill="none" strokeWidth="4" strokeLinecap="round" />
    <path className="grow-leaf" fill="#79ac4f" style={{ '--i': 0 }} d="M60 118c-18 2-30-8-34-20 16-2 30 6 34 20z" />
    <path className="grow-leaf" fill="#5c9036" style={{ '--i': 1 }} d="M61 95c16-2 28-12 30-24-15 0-28 10-30 24z" />
    <path className="grow-leaf" fill="#9bc577" style={{ '--i': 2 }} d="M61 66c-14-2-24-11-26-21 13 0 24 8 26 21z" />
    {/* Flower */}
    <g className="grow-bloom" style={{ transformOrigin: '60px 28px' }}>
      <circle cx="52" cy="28" r="7" fill="#f6e3e0" />
      <circle cx="68" cy="28" r="7" fill="#f6e3e0" />
      <circle cx="60" cy="20" r="7" fill="#f6e3e0" />
      <circle cx="60" cy="36" r="7" fill="#f6e3e0" />
      <circle cx="60" cy="28" r="5" fill="#d49d36" />
    </g>
  </svg>
);

export default GrowingSprout;
