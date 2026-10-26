// Two soft hills at the bottom of a photo hero, fading it into the page.
// The back hill moves with --parallax (set by useParallax) so the two
// layers slide at different speeds. Colours: canvas in front, leaf green behind.
// Placement lives in index.css (.hero-hills) so it never depends on Tailwind
// having scanned this file: without a `bottom`, an absolute child of a centred
// flex box lands in the middle of the hero.
const Hills = () => (
  <svg
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
    className="hero-hills"
  >
    <path
      className="hills-back"
      d="M0 70C180 30 360 30 540 55s360 45 540 15 270-40 360-30v80H0z"
      fill="rgb(92 144 54 / 0.35)"
    />
    <path d="M0 95C240 60 420 70 640 88s420 20 560-5 200-25 240-20v62H0z" fill="var(--color-canvas)" />
  </svg>
);

export default Hills;
