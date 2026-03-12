import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { establishments } from './establishments.schema';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  boundTo: uuid('bound_to')
    .notNull()
    .references(() => establishments.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  weight: integer('weight'),
  description: text('description'),
  recommendedPrice: integer('recommended_price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
