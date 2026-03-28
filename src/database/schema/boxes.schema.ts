import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  doublePrecision,
} from 'drizzle-orm/pg-core';

export const boxes = pgTable('boxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  boundTo: varchar('bound_to', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  picture: text('picture'),
  description: text('description'),
  recommendedPrice: doublePrecision('recommended_price'),
  minWeight: doublePrecision('min_weight'),
  maxWeight: doublePrecision('max_weight'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  quantityOfItems: integer('quantity_of_items').notNull(),
});
