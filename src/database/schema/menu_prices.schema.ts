import { pgTable, uuid, integer, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import { menu } from './menu.schema';

export const menuPrices = pgTable('menu_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  menuItemId: uuid('menu_item_id')
    .notNull()
    .references(() => menu.id, { onDelete: 'cascade' }),
  totalQuantity: integer('total_quantity').notNull(),
  availableQuantity: integer('available_quantity').notNull(),
  originalPrice: doublePrecision('original_price').notNull(),
  discountPrice: doublePrecision('discount_price'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
