import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// The core tables. Each feature module keeps its own tables in
// api/modules/<name>/schema.js. Change a table here, then run
// `npm run db:generate` to write the migration (see GUIDE.md).

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Answers from outside APIs (EskomSePush, OpenStreetMap), so a restart
// doesn't spend API calls again. api/cacheStore.js reads and writes it.
export const apiCache = pgTable(
  'api_cache',
  {
    key: text('key').primaryKey(), // e.g. "eskom:/schedule?id=..."
    value: jsonb('value').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('api_cache_fetched_idx').on(t.fetchedAt)],
);

// Shorthand for "this row belongs to a user" (deleting the user deletes it).
export const userId = () => integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' });
