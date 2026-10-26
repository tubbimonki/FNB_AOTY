import { sql } from 'drizzle-orm';
import { EVENTS, fakeAttendeeNames } from '../../../shared/events.js';
import { events } from './schema.js';

// excluded.<column> = the value we just tried to insert.
const fromNew = (column) => sql.raw(`excluded.${column}`);

const toRow = (e, i) => ({
  id: e.id,
  title: e.title,
  summary: e.summary,
  details: {
    description: e.description,
    bring: e.bring ?? [],
    note: e.note ?? null,
    venue: e.venue,
    city: e.city,
    organiser: e.organiser,
    url: e.url ?? null,
    image: e.image,
    category: e.category,
  },
  startsAt: new Date(e.startsAt),
  endsAt: new Date(e.endsAt),
  rewardLabel: e.reward.label,
  rewardPoints: e.reward.points,
  rewardPremiumDays: e.reward.premiumDays,
  seedAttendees: fakeAttendeeNames(e.fakeAttendees, i),
  seedCount: e.fakeAttendees,
  sample: Boolean(e.sample),
});

// Insert or update every event from shared/events.js. Safe to run at every
// start: an existing event gets the new text, and attendees are kept.
export async function seedEvents(db) {
  await db
    .insert(events)
    .values(EVENTS.map(toRow))
    .onConflictDoUpdate({
      target: events.id,
      set: {
        title: fromNew('title'),
        summary: fromNew('summary'),
        details: fromNew('details'),
        startsAt: fromNew('starts_at'),
        endsAt: fromNew('ends_at'),
        rewardLabel: fromNew('reward_label'),
        rewardPoints: fromNew('reward_points'),
        rewardPremiumDays: fromNew('reward_premium_days'),
        seedAttendees: fromNew('seed_attendees'),
        seedCount: fromNew('seed_count'),
        sample: fromNew('sample'),
      },
    });
}
