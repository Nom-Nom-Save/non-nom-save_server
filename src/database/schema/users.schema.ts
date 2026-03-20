import { pgTable, uuid, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  notifyNearby: boolean('notify_nearby').default(false).notNull(),
  notifyClosingSoon: boolean('notify_closing_soon').default(false).notNull(),
  notifyNewItems: boolean('notify_new_items').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
