import { Link } from 'react-router-dom';
import { Check, Gift, MapPin } from 'lucide-react';
import Carousel from '../../components/Carousel';
import Photo from '../../components/Photo';
import { eventImage } from '../../assets/images';
import { dateBadge, eventWhen } from './eventDates';
import { ReactionCounts } from './Reactions';

// One slide: the photo fills it, the text sits on a dark fade at the bottom.
const EventSlide = ({ event, reactions }) => {
  const badge = dateBadge(event.startsAt);
  return (
    <Link
      to={`/community/events/${event.id}`}
      className="relative block h-64 overflow-hidden rounded-2xl text-white no-underline hover:no-underline sm:h-80"
    >
      <Photo image={eventImage(event.image)} background className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute inset-0 bg-linear-to-t from-forest-950/90 via-forest-950/40 to-transparent" aria-hidden="true" />
      <span className="absolute left-3 top-3 grid min-w-12 place-items-center rounded-xl bg-white px-2 py-1 text-forest-900 shadow">
        <span className="text-lg font-bold leading-none">{badge.day}</span>
        <span className="text-xs font-semibold uppercase">{badge.month}</span>
      </span>
      <span className="absolute right-3 top-3 flex flex-col items-end gap-1">
        {event.going && <span className="pill bg-sprout text-forest-950"><Check className="size-3.5" aria-hidden="true" />Going</span>}
        {event.sample && <span className="pill bg-white/90 text-slate-700">Sample event</span>}
      </span>
      <span className="absolute inset-x-0 bottom-0 block p-4 sm:p-5">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sprout">{event.category} · {eventWhen(event)}</span>
        <span className="block text-lg font-bold leading-tight sm:text-xl">{event.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
          <span className="flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{event.city}</span>
          <span className="flex items-center gap-1"><Gift className="size-4" aria-hidden="true" />{event.reward.label}</span>
        </span>
        {reactions && <ReactionCounts counts={reactions.countsFor(event.id)} mine={reactions.mineFor(event.id)} onPhoto className="mt-2" />}
      </span>
    </Link>
  );
};

// Upcoming community events as photo slides, using the shared Carousel.
// reactions: from useReactionSummary(), for the emoji counts on each slide.
const EventsCarousel = ({ events, reactions }) => (
  <Carousel
    items={events}
    renderItem={(event) => <EventSlide event={event} reactions={reactions} />}
    label="Upcoming events"
    itemName="event"
    interval={7000}
    className=""
    controlsClassName="text-forest-700"
  />
);

export default EventsCarousel;
