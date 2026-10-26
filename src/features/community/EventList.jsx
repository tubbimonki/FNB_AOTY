import { Link } from 'react-router-dom';
import { Check, Gift } from 'lucide-react';
import Photo from '../../components/Photo';
import Pill from '../../components/ui/Pill';
import { eventImage } from '../../assets/images';
import { eventWhen } from './eventDates';
import { ReactionCounts } from './Reactions';

// Events as rows with a small photo: the "Events" tab on /community.
const EventList = ({ events, label, reactions }) => (
  <ul aria-label={label} className="card divide-y divide-slate-100 overflow-hidden p-0 sm:p-0">
    {events.map((event) => (
      <li key={event.id}>
        <Link to={`/community/events/${event.id}`} className={`flex items-center gap-3 p-3 no-underline hover:bg-forest-50 hover:no-underline ${event.past ? 'opacity-70' : ''}`}>
          <Photo image={eventImage(event.image)} background className="size-16 shrink-0 rounded-xl object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-forest-600">{eventWhen(event)}</span>
            <span className="block font-semibold text-forest-950">{event.title}</span>
            <span className="block text-sm text-slate-500">{event.city} · {event.attendeeCount} going</span>
            {reactions && <ReactionCounts counts={reactions.countsFor(event.id)} mine={reactions.mineFor(event.id)} className="mt-1" />}
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {event.going && <Pill tone="green"><Check className="size-3.5" aria-hidden="true" />Going</Pill>}
            {!event.past && <Pill tone="amber"><Gift className="size-3.5" aria-hidden="true" /><span className="max-sm:sr-only">{event.reward.label}</span></Pill>}
          </span>
        </Link>
      </li>
    ))}
  </ul>
);

export default EventList;
