import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  boundTo: varchar('bound_to', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  picture: text('picture'),
  weight: integer('weight'),
  description: text('description'),
  recommendedPrice: integer('recommended_price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
