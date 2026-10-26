import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../schema.js';

// What the bell on the dashboard shows. Filled only by listening on the bus.
// user_id set: for one member (a badge, an RSVP). Empty: for everyone, e.g.
// a power status change, or a severe alert for one place (place).
// key is unique, so hearing the same thing twice adds one row.
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    key: text('key').notNull().unique(), // e.g. 'badge:7:water-saver'
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // badge | event | report | service | alert
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    href: text('href'),
    place: text('place'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
);
