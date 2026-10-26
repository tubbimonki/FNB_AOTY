import { CalendarDays, MapPin } from 'lucide-react';
import Carousel from '../../components/Carousel';

const EventCard = ({ event }) => (
  <article className="flex h-full min-h-48 flex-col rounded-2xl border border-forest-100 bg-forest-50 p-5">
    <h3 className="mb-2 text-lg">{event.title}</h3>
    <p className="flex-1 text-forest-800">{event.body}</p>
    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-forest-700">
      <span className="flex items-center gap-1"><CalendarDays className="size-4" aria-hidden="true" />{event.when}</span>
      <span className="flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{event.where}</span>
    </p>
  </article>
);

// Community events as slides, using the shared Carousel.
const EventsCarousel = ({ events }) => (
  <section aria-labelledby="events-title">
    <h2 id="events-title" className="section-label">What's on</h2>
    <Carousel
      items={events}
      renderItem={(event) => <EventCard event={event} />}
      label="Community events"
      itemName="event"
      interval={7000}
      className=""
      controlsClassName="text-forest-700"
    />
  </section>
);

export default EventsCarousel;
