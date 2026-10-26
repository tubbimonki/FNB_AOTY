import { TONES } from './tones';

const Pill = ({ tone = 'green', children, className = '' }) => (
  <span className={`pill ${TONES[tone]} ${className}`}>{children}</span>
);

export default Pill;
