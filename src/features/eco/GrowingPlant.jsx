import { STAGES, stageFor } from './plantStages';

// The plant that grows with this week's eco-points and droops after three
// days without a logged action. Plain SVG shapes, so it needs no images.
const GrowingPlant = ({ points, wilting }) => {
  const stage = stageFor(points);
  const stem = [0, 30, 55, 80, 100][stage];
  const leaf = wilting ? '#a8a35a' : '#3e9a52';
  const leafDark = wilting ? '#8c8040' : '#2f7f52';
  // Leaves sit at fixed fractions up the stem, alternating sides.
  const leafCount = [0, 0, 2, 3, 4][stage];
  const leaves = [0.35, 0.55, 0.75, 0.9].slice(0, leafCount).map((f, i) => ({ y: 170 - stem * f, dx: i % 2 ? 1 : -1 }));

  return (
    <figure className="relative overflow-hidden rounded-3xl bg-linear-to-b from-violet-200 via-pink-100 to-amber-50 p-4">
      <svg viewBox="0 0 200 220" className="mx-auto h-56 w-auto" role="img" aria-label={`Your plant: ${STAGES[stage].label}${wilting ? ', wilting' : ''}`}>
        {/* Wilting tilts the whole plant from the soil. */}
        <g style={{ transform: wilting ? 'rotate(-12deg)' : 'none', transformOrigin: '100px 170px', transition: 'transform 0.7s' }}>
          {stage === 0 ? (
            <ellipse cx="100" cy="166" rx="8" ry="5" fill="#7a5a3d" />
          ) : (
            <>
              <path d={`M100 170 C 98 ${170 - stem / 2}, 102 ${170 - stem / 2}, 100 ${170 - stem}`} stroke={leafDark} strokeWidth="5" fill="none" strokeLinecap="round" />
              {leaves.map(({ y, dx }) => (
                <path key={y} d={`M100 ${y} q ${dx * 18} -18 ${dx * 34} -6 q ${dx * -14} 16 ${dx * -34} 6`} fill={leaf} />
              ))}
              {/* A sprout has just its two first leaves at the top. */}
              {stage === 1 && <path d="M100 140 q -12 -14 -24 -4 q 12 12 24 4 M100 140 q 12 -14 24 -4 q -12 12 -24 4" fill={leaf} />}
              {stage === 4 && !wilting && (
                <g transform={`translate(100 ${170 - stem})`}>
                  {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-10" rx="7" ry="11" fill="#f472b6" transform={`rotate(${a})`} />)}
                  <circle r="7" fill="#facc15" />
                </g>
              )}
            </>
          )}
        </g>
        {/* Pot */}
        <path d="M62 168 h76 l-9 46 h-58 z" fill="#c2703d" />
        <rect x="56" y="160" width="88" height="14" rx="4" fill="#d9824a" />
      </svg>
      <figcaption className="mt-1 text-center text-sm font-semibold text-forest-900">
        {STAGES[stage].label} · {points} points this week
        {wilting && <span className="block font-normal text-amber-800">Your plant is thirsty: log an action to perk it up.</span>}
        {points === 0 && !wilting && <span className="block font-normal text-slate-600">Log an action in Green Wallet to plant your seed.</span>}
      </figcaption>
    </figure>
  );
};

export default GrowingPlant;
