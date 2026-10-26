import { date, doublePrecision, index, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { userId } from '../../schema.js';

// One row per Green Wallet action someone logged. The id comes from the
// browser (crypto.randomUUID), so sending the same log twice is harmless.
// co2_kg and rand are copied from the action when it's logged, so totals
// are a plain SUM() and don't change if an estimate is tuned later.
export const walletLogs = pgTable(
  'wallet_logs',
  {
    userId: userId(),
    id: text('id').notNull(),
    actionId: text('action_id').notNull(),
    category: text('category').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    co2Kg: doublePrecision('co2_kg').notNull(),
    rand: doublePrecision('rand').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index('wallet_logs_user_date_idx').on(t.userId, t.date)],
);
