import { Router } from 'express';
import { and, count, eq } from 'drizzle-orm';
import { optionalAuth, requireAuth } from '../../middleware/requireAuth.js';
import { isReaction, REACTIONS, seedReactionCounts } from '../../../shared/reactions.js';
import { eventReactions } from './schema.js';

// Emoji reactions on community events (smile, heart...). Tap once to react,
// again to take it back. Emits 'reaction.added' / 'reaction.removed' so the
// impact module can award a couple of points.
// Its table can sit in a separate database: reactionsDb (REACTIONS_DATABASE_URL),
// else the main db. Logins are still checked against the main db.
const EVENT_ID = /^[a-z0-9-]{1,80}$/;

export default {
  name: 'reactions',
  events: { emits: ['reaction.added', 'reaction.removed'], listens: [] },

  router({ db, reactionsDb = db, jwtSecret, bus }) {
    const router = Router();
    const auth = requireAuth({ db, jwtSecret });
    const maybeUser = optionalAuth({ db, jwtSecret });

    // { [eventId]: { counts: { smile: 3, ... }, mine: ['heart'] } } for some or all events.
    const summary = async (user, eventId) => {
      const only = eventId ? eq(eventReactions.eventId, eventId) : undefined;
      const [totals, mine] = await Promise.all([
        reactionsDb
          .select({ eventId: eventReactions.eventId, reaction: eventReactions.reaction, n: count() })
          .from(eventReactions)
          .where(only)
          .groupBy(eventReactions.eventId, eventReactions.reaction),
        user
          ? reactionsDb.select().from(eventReactions).where(and(eq(eventReactions.userId, user.id), only))
          : [],
      ]);
      const out = {};
      const entry = (id) => (out[id] ??= { counts: seedReactionCounts(id), mine: [] });
      if (eventId) entry(eventId);
      for (const t of totals) entry(t.eventId).counts[t.reaction] += t.n;
      for (const m of mine) entry(m.eventId).mine.push(m.reaction);
      return out;
    };

    // GET /api/reactions/events -> { reactions: { [eventId]: { counts, mine } }, kinds }
    // Events nobody has reacted to yet aren't listed; use seedReactionCounts for those.
    router.get('/events', maybeUser, async (req, res) => {
      res.json({ reactions: await summary(req.user), kinds: REACTIONS });
    });

    // GET /api/reactions/events/:id -> { counts, mine }
    router.get('/events/:id', maybeUser, async (req, res) => {
      if (!EVENT_ID.test(req.params.id)) return res.status(400).json({ error: 'Unknown event' });
      res.json((await summary(req.user, req.params.id))[req.params.id]);
    });

    // POST /api/reactions/events/:id { reaction: 'heart' } -> { counts, mine, reacted }
    // A toggle: the first tap adds the reaction, the next one removes it.
    router.post('/events/:id', auth, async (req, res) => {
      const eventId = req.params.id;
      const reaction = req.body?.reaction;
      if (!EVENT_ID.test(eventId)) return res.status(400).json({ error: 'Unknown event' });
      if (!isReaction(reaction)) return res.status(400).json({ error: `Pick one of: ${REACTIONS.map((r) => r.id).join(', ')}` });

      const row = { eventId, userId: req.user.id, reaction };
      const removed = await reactionsDb
        .delete(eventReactions)
        .where(and(eq(eventReactions.eventId, eventId), eq(eventReactions.userId, req.user.id), eq(eventReactions.reaction, reaction)))
        .returning();
      const reacted = removed.length === 0;
      if (reacted) await reactionsDb.insert(eventReactions).values(row).onConflictDoNothing();
      await bus.emit(reacted ? 'reaction.added' : 'reaction.removed', row);

      res.json({ ...(await summary(req.user, eventId))[eventId], reacted });
    });

    return router;
  },
};
