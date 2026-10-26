import { Info, OctagonAlert, TriangleAlert } from 'lucide-react';

// How each severity looks. Red is kept for "act now" warnings only.
export const SEVERITY = {
  severe: { icon: OctagonAlert, card: 'bg-linear-to-r from-red-600 to-red-700 text-white border-red-700', meta: 'text-red-100', label: 'Warning' },
  warning: { icon: TriangleAlert, card: 'bg-amber-50 text-amber-950 border-amber-200', meta: 'text-amber-800', label: 'Watch' },
  info: { icon: Info, card: 'bg-blue-50 text-blue-950 border-blue-200', meta: 'text-blue-800', label: 'Advisory' },
};
