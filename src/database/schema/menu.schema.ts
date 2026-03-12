import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { establishments } from './establishments.schema';

export const menu = pgTable('menu', {
  id: uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishments.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull(),
  itemType: varchar('item_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
});
