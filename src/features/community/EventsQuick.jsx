import { useId } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check } from 'lucide-react';
import { eventWhen } from './eventDates';
import { useEvents } from './useEvents';

// Small "Coming up" card for the wide-screen side columns: the next few
// events, the ones you're going to first.
const EventsQuick = ({ limit = 3, className = '' }) => {
  const titleId = useId();
  const { status, events } = useEvents();
  const upcoming = events.filter((e) => !e.past).sort((a, b) => Number(Boolean(b.going)) - Number(Boolean(a.going))).slice(0, limit);

  return (
    <section aria-labelledby={titleId} className={`card ${className}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id={titleId} className="flex items-center gap-2 text-base"><CalendarDays className="size-4 text-violet-600" aria-hidden="true" />Coming up</h2>
        <Link to="/community?tab=events" className="text-sm font-semibold">All events →</Link>
      </div>
      {status === 'loading' && <p className="text-sm text-slate-500">Loading events…</p>}
      {status === 'ready' && upcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming events yet.</p>}
      <ul className="divide-y divide-slate-100">
        {upcoming.map((event) => (
          <li key={event.id} className="py-2">
            <Link to={`/community/events/${event.id}`} className="font-semibold text-forest-950">{event.title}</Link>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              {event.going && <Check className="size-3.5 text-emerald-700" aria-label="Going" />}
              {eventWhen(event)} · {event.city}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default EventsQuick;
