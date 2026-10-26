import { index, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

// Who reacted with what to which event. One row per user, event and emoji.
// No foreign keys on purpose: this table can live in its own database
// (REACTIONS_DATABASE_URL), where the users and events tables don't exist.
export const eventReactions = pgTable(
  'event_reactions',
  {
    eventId: text('event_id').notNull(),
    userId: integer('user_id').notNull(),
    reaction: text('reaction').notNull(), // an id from shared/reactions.js
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId, t.reaction] }), index('event_reactions_user_idx').on(t.userId)],
);
