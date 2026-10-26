import { Router } from 'express';
import { and, asc, count, eq } from 'drizzle-orm';
import { optionalAuth, requireAuth } from '../../middleware/requireAuth.js';
import { users } from '../../schema.js';
import { eventAttendees, events } from './schema.js';
import { seedEvents } from './seed.js';

// Community events: list, details, and "I'm going".
// Attending emits 'event.attended' (cancelling emits 'event.cancelled'), and
// the impact module turns that into the event's reward. This module never
// touches points itself.

// "Thandi Mokoena" -> "Thandi M." (no full surnames in a public list)
export const shortName = (name = '') => {
  const [first, second] = name.trim().split(/\s+/);
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
};

const toEvent = (row, { count: realCount = 0, going = false, now }) => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  ...row.details, // description, bring, note, venue, city, organiser, url, image, category
  startsAt: row.startsAt.toISOString(),
  endsAt: row.endsAt.toISOString(),
  reward: { label: row.rewardLabel, points: row.rewardPoints, premiumDays: row.rewardPremiumDays },
  sample: row.sample,
  attendeeCount: row.seedCount + realCount,
  going,
  past: row.endsAt < now,
});

export default {
  name: 'events',
  events: { emits: ['event.attended', 'event.cancelled'], listens: [] },

  router({ db, jwtSecret, bus, now = () => new Date() }) {
    const router = Router();
    const auth = requireAuth({ db, jwtSecret });
    const maybeUser = optionalAuth({ db, jwtSecret });

    // Seed once per start. Every route waits for it.
    const ready = seedEvents(db);
    ready.catch((err) => console.error('Seeding events failed:', err));

    const findEvent = async (id) => (await db.select().from(events).where(eq(events.id, id)))[0];

    // The full event: real attendees first ("You" for yourself), then the seeded names.
    const fullEvent = async (row, user) => {
      const people = await db
        .select({ userId: users.id, name: users.name })
        .from(eventAttendees)
        .innerJoin(users, eq(users.id, eventAttendees.userId))
        .where(eq(eventAttendees.eventId, row.id))
        .orderBy(asc(eventAttendees.createdAt));
      const going = people.some((p) => p.userId === user?.id);
      return {
        ...toEvent(row, { count: people.length, going, now: now() }),
        attendees: [...people.map((p) => (p.userId === user?.id ? 'You' : shortName(p.name))), ...row.seedAttendees],
      };
    };

    // GET /api/events -> { events, sample }. Upcoming first (soonest on top), then past ones.
    router.get('/', maybeUser, async (req, res) => {
      await ready;
      const [rows, counts, mine] = await Promise.all([
        db.select().from(events).orderBy(asc(events.startsAt)),
        db.select({ eventId: eventAttendees.eventId, n: count() }).from(eventAttendees).groupBy(eventAttendees.eventId),
        req.user ? db.select({ eventId: eventAttendees.eventId }).from(eventAttendees).where(eq(eventAttendees.userId, req.user.id)) : [],
      ]);
      const countOf = new Map(counts.map((c) => [c.eventId, c.n]));
      const goingTo = new Set(mine.map((m) => m.eventId));
      const list = rows
        .map((row) => toEvent(row, { count: countOf.get(row.id), going: goingTo.has(row.id), now: now() }))
        .sort((a, b) => a.past - b.past);
      res.json({ events: list, sample: list.some((e) => e.sample) });
    });

    // GET /api/events/:id -> { event } with the attendees list.
    router.get('/:id', maybeUser, async (req, res) => {
      await ready;
      const row = await findEvent(req.params.id);
      if (!row) return res.status(404).json({ error: 'Event not found' });
      res.json({ event: await fullEvent(row, req.user) });
    });

    // POST /api/events/:id/attend -> 201 { event }. Saying it twice is fine.
    router.post('/:id/attend', auth, async (req, res) => {
      await ready;
      const row = await findEvent(req.params.id);
      if (!row) return res.status(404).json({ error: 'Event not found' });
      if (row.endsAt < now()) return res.status(409).json({ error: 'This event has already happened' });

      const added = await db.insert(eventAttendees).values({ eventId: row.id, userId: req.user.id }).onConflictDoNothing().returning();
      // Only a new RSVP earns the reward, so clicking twice can't double it.
      if (added.length) {
        await bus.emit('event.attended', {
          userId: req.user.id,
          eventId: row.id,
          title: row.title,
          reward: { label: row.rewardLabel, points: row.rewardPoints, premiumDays: row.rewardPremiumDays },
        });
      }
      res.status(201).json({ event: await fullEvent(row, req.user) });
    });

    // DELETE /api/events/:id/attend -> { event }. Not going after all: the reward goes too.
    router.delete('/:id/attend', auth, async (req, res) => {
      await ready;
      const row = await findEvent(req.params.id);
      if (!row) return res.status(404).json({ error: 'Event not found' });
      if (row.endsAt < now()) return res.status(409).json({ error: 'This event has already happened' });

      const removed = await db
        .delete(eventAttendees)
        .where(and(eq(eventAttendees.eventId, row.id), eq(eventAttendees.userId, req.user.id)))
        .returning();
      if (removed.length) await bus.emit('event.cancelled', { userId: req.user.id, eventId: row.id });
      res.json({ event: await fullEvent(row, req.user) });
    });

    return router;
  },
};
