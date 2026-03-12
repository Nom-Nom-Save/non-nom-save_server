import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const typesOfProducts = pgTable('types_of_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
});
