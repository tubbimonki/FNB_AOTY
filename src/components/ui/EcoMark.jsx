// The Eco 5.0 leaf from public/favicon.svg, so the in-app logo matches the
// browser tab. The leaf takes the text colour; the midrib stays dark forest.
const EcoMark = ({ className = '' }) => (
  <svg viewBox="11 13 40 40" className={className} aria-hidden="true" focusable="false">
    <path d="M19 45C19 27 30 16 49 15c0 19-11 30-30 30z" fill="currentColor" />
    <path d="M19 45 40 24" stroke="var(--color-forest-900)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M19 45l-6 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default EcoMark;
