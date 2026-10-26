import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { userId } from '../../schema.js';

// Ticked emergency checklist items: a row means "done".
export const checklistTicks = pgTable(
  'checklist_ticks',
  {
    userId: userId(),
    itemId: text('item_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemId] })],
);
