import { doublePrecision, index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { userId } from '../../schema.js';

// Residents' problem reports. lat/lon are rounded to ~100 m before saving.
export const reports = pgTable(
  'reports',
  {
    id: serial('id').primaryKey(),
    userId: userId(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    status: text('status').notNull().default('received'), // received | verified | resolved | rejected
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('reports_user_idx').on(t.userId), index('reports_created_idx').on(t.createdAt)],
);
