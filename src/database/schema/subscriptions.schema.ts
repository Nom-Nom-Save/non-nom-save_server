import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { subscriptionPlans } from './subscription_plans.schema';
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'cancelled',
  'expired',
  'pending',
]);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  subscriptionPlanId: uuid('subscription_plan_id').references(() => subscriptionPlans.id),
  paypalSubscriptionId: varchar('paypal_subscription_id', { length: 255 }).unique(),
  status: subscriptionStatusEnum('status').notNull().default('pending'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
});
