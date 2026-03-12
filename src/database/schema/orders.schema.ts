import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  totalPrice: integer('total_price').notNull(),
  orderStatus: varchar('order_status', { length: 50 }).notNull(),
  qrCodeData: varchar('qr_code_data', { length: 255 }),
  reservedAt: timestamp('reserved_at'),
  expiresAt: timestamp('expires_at'),
  completedAt: timestamp('completed_at'),
});
