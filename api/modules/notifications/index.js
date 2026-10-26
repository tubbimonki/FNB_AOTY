import { Router } from 'express';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { optionalAuth } from '../../middleware/requireAuth.js';
import { notifications } from './schema.js';

// The dashboard bell. This module never gets called by the others: it only
// listens on the bus and turns what it hears into short messages.
// Personal ones (badges, RSVPs, reports) go to one member; area ones
// (power changes, severe alerts) go to everyone.
const MINE = 30;
const EVERYONE = 10;

const toItem = (row) => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  body: row.body,
  href: row.href ?? undefined,
  forYou: row.userId !== null,
  createdAt: row.createdAt.toISOString(),
});

export default {
  name: 'notifications',
  events: { emits: [], listens: ['badge.unlocked', 'event.attended', 'report.created', 'service.changed', 'alert.issued'] },

  subscribe({ db, bus }) {
    // Same key twice (a retry, a restart) adds nothing.
    const add = (row) => db.insert(notifications).values(row).onConflictDoNothing();

    bus.on('badge.unlocked', ({ userId, badge, label, level }) =>
      add({
        key: `badge:${userId}:${badge}`,
        userId,
        kind: 'badge',
        title: level ? `Level ${level}: ${label}` : `Badge unlocked: ${label}`,
        body: level ? 'You reached a new level. Keep going!' : 'Nice work. See all your badges on Your Impact.',
        href: '/impact',
      }),
    );
    bus.on('event.attended', ({ userId, eventId, title, reward }) =>
      add({
        key: `event:${userId}:${eventId}`,
        userId,
        kind: 'event',
        title: `You're going to ${title}`,
        body: reward?.label ? `Reward: ${reward.label}` : 'See you there!',
        href: `/community/events/${eventId}`,
      }),
    );
    bus.on('report.created', ({ userId, reportId, category }) =>
      add({
        key: `report:${reportId}`,
        userId,
        kind: 'report',
        title: `Report received: ${category}`,
        body: 'Thanks for flagging it. Reports earn you eco-points too.',
        href: '/map',
      }),
    );
    bus.on('service.changed', ({ service, area, to, message, at }) =>
      add({
        key: `service:${service}:${to}:${at}`,
        kind: 'service',
        title: `${service === 'water' ? 'Water' : 'Power'} update for ${area}`,
        body: message ?? '',
        href: '/services',
      }),
    );
    bus.on('alert.issued', ({ alert, place, day }) =>
      add({
        key: `alert:${day}:${place}:${alert.title}`.slice(0, 200),
        kind: 'alert',
        title: alert.title,
        body: alert.body ?? '',
        href: '/alerts',
        place,
      }),
    );
  },

  router({ db, jwtSecret }) {
    const router = Router();

    // GET /api/notifications?place=Johannesburg -> { items }, newest first.
    // Members get theirs plus the ones for everyone; visitors only the latter.
    // What's unread is kept in the browser (it remembers when you last looked).
    router.get('/', optionalAuth({ db, jwtSecret }), async (req, res) => {
      const place = String(req.query.place ?? '').slice(0, 60);
      const forEveryone = and(isNull(notifications.userId), or(isNull(notifications.place), eq(notifications.place, place)));
      const [mine, everyone] = await Promise.all([
        req.user
          ? db.select().from(notifications).where(eq(notifications.userId, req.user.id)).orderBy(desc(notifications.createdAt)).limit(MINE)
          : [],
        db.select().from(notifications).where(forEveryone).orderBy(desc(notifications.createdAt)).limit(EVERYONE),
      ]);
      const items = [...mine, ...everyone].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id).map(toItem);
      res.json({ items });
    });

    return router;
  },
};
