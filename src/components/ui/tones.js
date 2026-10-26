// Colour pairs for icon chips and status pills, one per meaning.
// Full class names on purpose: Tailwind only builds classes it can see written out.
export const TONES = {
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-600',
  cyan: 'bg-cyan-50 text-cyan-700',
  purple: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-slate-100 text-slate-600',
};

// Service status -> tone and label, shared by the services page and the API.
export const STATUS = {
  ok: { tone: 'green', label: 'Normal' },
  intermittent: { tone: 'amber', label: 'Intermittent' },
  delayed: { tone: 'amber', label: 'Delayed' },
  outage: { tone: 'red', label: 'Outage' },
  scheduled: { tone: 'blue', label: 'Scheduled' },
  unknown: { tone: 'gray', label: 'Unknown' },
};
