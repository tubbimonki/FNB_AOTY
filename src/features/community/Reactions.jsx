import { useLocation, useNavigate } from 'react-router-dom';
import { REACTIONS } from '../../../shared/reactions.js';
import { useAuth } from '../auth/useAuth';
import { useEventReactions } from './useReactions';

// Read-only counts for a slide or list row, e.g. "😊 6 ❤️ 2". Zeros are left out.
// onPhoto: white chips for the dark photo slides, green ones elsewhere.
export const ReactionCounts = ({ counts, mine = [], onPhoto = false, className = '' }) => {
  const shown = REACTIONS.filter((r) => counts[r.id] > 0);
  if (!shown.length) return null;
  const base = onPhoto ? 'bg-white/90 text-slate-700' : 'bg-forest-50 text-slate-700';
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      <span className="sr-only">Reactions: {shown.map((r) => `${counts[r.id]} ${r.label}`).join(', ')}</span>
      {shown.map((r) => (
        <span key={r.id} aria-hidden="true" className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${mine.includes(r.id) ? 'bg-sprout text-forest-950' : base}`}>
          {r.emoji} {counts[r.id]}
        </span>
      ))}
    </span>
  );
};

// Tap an emoji to react, tap it again to take it back. Visitors go to log in first.
export const ReactionBar = ({ eventId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { counts, mine, busy, error, toggle } = useEventReactions(eventId);

  const tap = (id) => (user ? toggle(id) : navigate('/login', { state: { from: location.pathname } }));

  return (
    <div>
      <div role="group" aria-label="Reactions" className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const on = mine.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={on}
              aria-label={`${r.label} (${counts[r.id]})`}
              disabled={busy}
              onClick={() => tap(r.id)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold tabular-nums transition-colors ${
                on ? 'border-forest-600 bg-forest-50 text-forest-900' : 'border-slate-200 bg-white text-slate-700 hover:border-forest-300'
              }`}
            >
              <span aria-hidden="true" className="text-lg">{r.emoji}</span>
              {counts[r.id]}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
