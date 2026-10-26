import { pinType } from './pinTypes';

// A coloured circle with the type's white outline icon: legend, lists and
// (as static markup) the map markers all use it, so they always match.
const PinDot = ({ type, size = 24, ring = false }) => {
  const { color, Icon } = pinType(type);
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: color, boxShadow: ring ? '0 0 0 3px #bef264' : undefined }}
    >
      <Icon color="#fff" strokeWidth={2.25} style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  );
};

export default PinDot;
