import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { boxes } from './boxes.schema';
import { products } from './products.schema';

export const boxItems = pgTable('box_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  boxId: uuid('box_id')
    .notNull()
    .references(() => boxes.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
});
