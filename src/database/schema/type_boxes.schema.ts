import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { typesOfProducts } from './types_of_products.schema';
import { boxes } from './boxes.schema';

export const typeBoxes = pgTable('type_boxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  typeId: uuid('type_id')
    .notNull()
    .references(() => typesOfProducts.id, { onDelete: 'cascade' }),
  boxId: uuid('box_id')
    .notNull()
    .references(() => boxes.id, { onDelete: 'cascade' }),
});
