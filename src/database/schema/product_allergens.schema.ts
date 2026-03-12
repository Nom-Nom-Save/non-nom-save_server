import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { products } from './products.schema';
import { typesOfAllergens } from './types_of_allergens.schema';

export const productAllergens = pgTable('product_allergens', {
  id: uuid('id').primaryKey().defaultRandom(),
  idProduct: uuid('id_product')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  idAllergen: uuid('id_allergen')
    .notNull()
    .references(() => typesOfAllergens.id, { onDelete: 'cascade' }),
});
