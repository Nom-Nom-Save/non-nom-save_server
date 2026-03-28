import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  doublePrecision,
} from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  boundTo: varchar('bound_to', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  picture: text('picture'),
  weight: doublePrecision('weight'),
  description: text('description'),
  recommendedPrice: doublePrecision('recommended_price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
