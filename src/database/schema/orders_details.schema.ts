import { pgTable, uuid, integer } from 'drizzle-orm/pg-core';
import { orders } from './orders.schema';
import { menuPrices } from './menu_prices.schema';

export const ordersDetails = pgTable('orders_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  menuPriceId: uuid('menu_price_id')
    .notNull()
    .references(() => menuPrices.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
});
