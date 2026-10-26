import { integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { userId } from '../../schema.js';

// Rewards this module gave out after hearing an event on the bus, e.g.
// 'event.attended' -> source 'event:clean-c-muizenberg-nov'. The impact module
// owns this table; other modules only announce what happened.
export const impactAwards = pgTable(
  'impact_awards',
  {
    userId: userId(),
    source: text('source').notNull(), // what earned it, unique per user
    label: text('label').notNull(), // shown on Your Impact
    points: integer('points').notNull().default(0),
    premiumDays: integer('premium_days').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.source] })],
);

// Badges and levels already reached, so 'badge.unlocked' is announced once.
// badge is a badge id ('water-saver') or a level ('level-2').
export const impactBadges = pgTable(
  'impact_badges',
  {
    userId: userId(),
    badge: text('badge').notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badge] })],
);
