import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
} from 'drizzle-orm/pg-core';

export const establishments = pgTable('establishments', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address').notNull(),
  latitude: numeric('latitude').notNull(),
  longitude: numeric('longitude').notNull(),
  workingHours: varchar('working_hours', { length: 255 }),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  boundTo: varchar('bound_to', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
