import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { products } from './products.schema';
import { typesOfProducts } from './types_of_products.schema';

export const productTypes = pgTable('product_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  idProduct: uuid('id_product')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  idType: uuid('id_type')
    .notNull()
    .references(() => typesOfProducts.id, { onDelete: 'cascade' }),
});
