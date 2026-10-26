import { date, doublePrecision, index, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { userId } from '../../schema.js';

// Water Usage logs. Like wallet_logs, the browser picks the id.
export const waterLogs = pgTable(
  'water_logs',
  {
    userId: userId(),
    id: text('id').notNull(),
    litres: doublePrecision('litres').notNull(),
    use: text('use').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index('water_logs_user_date_idx').on(t.userId, t.date)],
);

// The last footprint questionnaire, one row per user.
export const footprints = pgTable('footprints', {
  userId: userId().primaryKey(),
  answers: jsonb('answers').notNull(),
  totalT: doublePrecision('total_t').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
