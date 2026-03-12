import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const typesOfAllergens = pgTable('types_of_allergens', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
});
