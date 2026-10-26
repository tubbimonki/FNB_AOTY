import { Link, useLocation, useParams } from 'react-router-dom';
import { CalendarDays, Check, ExternalLink, Gift, Info, MapPin, Navigation, Users } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import IconChip from '../../components/ui/IconChip';
import LoadState from '../../components/ui/LoadState';
import Pill from '../../components/ui/Pill';
import Photo from '../../components/Photo';
import { eventImage } from '../../assets/images';
import { useAuth } from '../auth/useAuth';
import { eventWhen } from './eventDates';
import { useEvent } from './useEvents';
import { ReactionBar } from './Reactions';

const SHOW_NAMES = 12; // the rest become "and N more"

const initials = (name) => name.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// Attend / cancel, or a login link for visitors.
const AttendBox = ({ event, offline, saving, error, attend, cancel }) => {
  const { user } = useAuth();
  const location = useLocation();

  let action;
  if (event.past) {
    action = <p className="text-slate-600">This event has already happened.</p>;
  } else if (!user) {
    action = <Link to="/login" state={{ from: location.pathname }} className="btn w-full">Log in to attend</Link>;
  } else if (offline) {
    action = <p className="text-slate-600">Can't reach the server right now, so you can't sign up. Try again in a bit.</p>;
  } else if (event.going) {
    action = (
      <div className="space-y-2">
        <p className="flex items-center gap-2 font-semibold text-emerald-700"><Check className="size-5" aria-hidden="true" />You're going!</p>
        <button type="button" onClick={cancel} disabled={saving} className="btn btn-light w-full border border-forest-200">
          {saving ? 'Saving…' : "I can't make it"}
        </button>
      </div>
    );
  } else {
    action = (
      <button type="button" onClick={attend} disabled={saving} className="btn w-full">
        {saving ? 'Saving…' : 'Attend'}
      </button>
    );
  }

  return (
    <section aria-label="Attend" className="card space-y-3">
      <p className="flex items-center gap-2 text-sm text-slate-600"><Users className="size-4" aria-hidden="true" />{event.attendeeCount} people going</p>
      {action}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </section>
  );
};

// The small prize block under the Attend button.
const RewardBlock = ({ event }) => {
  const { reward, going, past } = event;
  const status = past ? 'Rewards were for going to this event.' : going ? 'Unlocked! It’s on your Impact page.' : 'Tap Attend to claim it.';
  return (
    <section aria-labelledby="reward-title" className="card flex items-start gap-3 border-amber-200 bg-amber-50">
      <IconChip icon={Gift} tone="amber" />
      <div className="min-w-0 flex-1">
        <h2 id="reward-title" className="text-sm font-semibold uppercase tracking-wide text-amber-800">Reward for going</h2>
        <p className="text-lg font-bold text-forest-950">{reward.label}</p>
        <p className="text-sm text-slate-600">
          {status} {going && !past && <Link to="/impact">See Your Impact</Link>}
        </p>
      </div>
    </section>
  );
};

const Attendees = ({ event }) => {
  const shown = event.attendees.slice(0, SHOW_NAMES);
  const more = event.attendeeCount - shown.length;
  return (
    <section aria-labelledby="attendees-title" className="card">
      <h2 id="attendees-title" className="section-label">Who's going ({event.attendeeCount})</h2>
      <ul className="flex flex-wrap gap-2">
        {shown.map((name, i) => (
          <li key={`${name}-${i}`} className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm ${name === 'You' ? 'bg-sprout/40 font-semibold' : 'bg-forest-50'}`}>
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-forest-700 text-xs font-bold text-white">{initials(name) || '?'}</span>
            {name}
          </li>
        ))}
      </ul>
      {more > 0 && <p className="mt-3 text-sm text-slate-500">and {more} more</p>}
      <p className="mt-3 text-xs text-slate-400">Most of these names are made up for the demo.</p>
    </section>
  );
};

// /community/events/:eventId: everything about one event.
const EventPage = () => {
  const { eventId } = useParams();
  const { status, event, offline, retry, saving, error, attend, cancel } = useEvent(eventId);

  if (status !== 'ready' || !event) {
    return (
      <>
        <AppBar title="Event" back="/community?tab=events" />
        <main className="page">
          <div className="card">
            {status === 'loading' ? <LoadState status="loading" what="the event" /> : (
              <div className="py-6 text-center">
                <p className="mb-3 text-slate-600">We couldn't find that event.</p>
                {status === 'missing' && <button type="button" onClick={retry} className="btn btn-light mr-2 border border-forest-200">Try again</button>}
                <Link to="/community?tab=events" className="btn">See all events</Link>
              </div>
            )}
          </div>
        </main>
      </>
    );
  }

  const where = `${event.venue}, ${event.city}`;
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}`;

  return (
    <>
      <AppBar title="Event" back="/community?tab=events" />
      <main className="page grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="space-y-5">
          <Photo image={eventImage(event.image)} className="h-56 w-full rounded-2xl object-cover sm:h-72" />
          <header className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Pill tone="green">{event.category}</Pill>
              {event.sample && <Pill tone="gray">Sample event</Pill>}
              {event.past && <Pill tone="gray">Past event</Pill>}
            </div>
            <h2 className="text-2xl sm:text-3xl">{event.title}</h2>
            <p className="text-lg text-forest-800/80">{event.summary}</p>
            <ReactionBar eventId={event.id} />
          </header>

          <ul className="card space-y-3">
            <li className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-forest-600" aria-hidden="true" /><span><span className="sr-only">When: </span>{eventWhen(event)}</span></li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-forest-600" aria-hidden="true" />
              <span className="flex-1"><span className="sr-only">Where: </span>{where}</span>
              <a href={directions} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-sm font-semibold"><Navigation className="size-4" aria-hidden="true" />Directions</a>
            </li>
            <li className="flex items-start gap-3"><Users className="mt-0.5 size-5 shrink-0 text-forest-600" aria-hidden="true" /><span><span className="sr-only">Organiser: </span>{event.organiser}</span></li>
          </ul>

          <section aria-labelledby="about-title" className="space-y-3">
            <h2 id="about-title" className="section-label">About this event</h2>
            {event.description.map((paragraph) => <p key={paragraph} className="text-forest-900">{paragraph}</p>)}
            {event.note && (
              <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><Info className="size-4 shrink-0" aria-hidden="true" />{event.note}</p>
            )}
            {event.sample && <p className="text-sm text-slate-500">This is a sample event for the demo, not a real one.</p>}
          </section>

          {event.bring?.length > 0 && (
            <section aria-labelledby="bring-title">
              <h2 id="bring-title" className="section-label">What to bring</h2>
              <ul className="leaf-list">{event.bring.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}

          {event.url && (
            <a href={event.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold">
              More from {event.organiser}<ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <AttendBox event={event} offline={offline} saving={saving} error={error} attend={attend} cancel={cancel} />
          <RewardBlock event={event} />
          <Attendees event={event} />
        </aside>
      </main>
    </>
  );
};

export default EventPage;
