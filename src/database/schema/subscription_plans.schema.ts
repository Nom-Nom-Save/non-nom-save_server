import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  char,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: char('currency', { length: 3 }).notNull(),
  durationDays: integer('duration_days').notNull(),
  isActive: boolean('is_active').default(true),
});
