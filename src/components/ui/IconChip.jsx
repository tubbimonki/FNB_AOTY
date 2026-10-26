import { TONES } from './tones';

// The small tinted square behind an icon (Quick Access, list rows, badges).
const IconChip = ({ icon: Icon, tone = 'green', size = 'md', className = '' }) => {
  const box = size === 'lg' ? 'size-12 rounded-2xl' : size === 'sm' ? 'size-8 rounded-lg' : 'size-10 rounded-xl';
  const glyph = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-4' : 'size-5';
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center ${box} ${TONES[tone]} ${className}`}>
      <Icon className={glyph} strokeWidth={2} />
    </span>
  );
};

export default IconChip;
