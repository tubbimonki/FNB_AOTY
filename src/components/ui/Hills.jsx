// Two soft hills at the bottom of a photo hero, fading it into the page.
// The back hill moves with --parallax (set by useParallax) so the two
// layers slide at different speeds. Colours: canvas in front, leaf green behind.
// Placement is an inline style on purpose: it is the one thing that must never
// go missing. Without `position: absolute; bottom`, the svg becomes a normal
// item in the centred hero and floats in the middle as a full-width strip.
// 4rem tall on phones, growing to 6rem on wide screens.
const PLACE = { position: 'absolute', left: 0, right: 0, bottom: -1, width: '100%', height: 'clamp(4rem, 8vw, 6rem)', pointerEvents: 'none' };

const Hills = () => (
  <svg
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
    className="hero-hills"
    style={PLACE}
  >
    <path
      className="hills-back"
      d="M0 70C180 30 360 30 540 55s360 45 540 15 270-40 360-30v80H0z"
      fill="rgb(92 144 54 / 0.35)"
    />
    <path d="M0 95C240 60 420 70 640 88s420 20 560-5 200-25 240-20v62H0z" fill="#f4f7f5" />
  </svg>
);

export default Hills;
