import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { userId } from '../../schema.js';

// Community events. Seeded from shared/events.js at start (see seed.js).
// details holds the text parts the list never filters on (description, bring, note...).
export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey(), // e.g. 'clean-c-muizenberg-nov'
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    details: jsonb('details').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    rewardLabel: text('reward_label').notNull(),
    rewardPoints: integer('reward_points').notNull().default(0),
    rewardPremiumDays: integer('reward_premium_days').notNull().default(0),
    seedAttendees: jsonb('seed_attendees').notNull(), // made-up names for the demo
    seedCount: integer('seed_count').notNull(),
    sample: boolean('sample').notNull().default(false),
  },
  (t) => [index('events_starts_idx').on(t.startsAt)],
);

// Who said they're going. One row per user per event.
export const eventAttendees = pgTable(
  'event_attendees',
  {
    eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: userId(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId] }), index('event_attendees_user_idx').on(t.userId)],
);
