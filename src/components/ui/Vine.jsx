// A thin vine with leaves, used as a quiet decoration (app bar, footer).
// Decorative only, so it is hidden from screen readers. Colour comes from currentColor.
const LEAVES = [
  [18, 19, -40], [38, 27, 35], [58, 21, -30], [80, 13, 25], [102, 13, -20],
];

const Vine = ({ className = '' }) => (
  <svg viewBox="0 0 120 40" fill="none" aria-hidden="true" focusable="false" className={className}>
    <path d="M0 30 C20 10 40 40 60 22 S100 6 120 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {LEAVES.map(([x, y, angle]) => (
      // One leaf: two curves meeting at a point, rotated off the stem.
      <path key={x} d={`M${x} ${y} q5 -7 11 -3 q-5 7 -11 3z`} fill="currentColor" transform={`rotate(${angle} ${x} ${y})`} />
    ))}
  </svg>
);

export default Vine;
