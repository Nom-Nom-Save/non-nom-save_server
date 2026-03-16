import { pgTable, uuid, varchar, text, timestamp, boolean, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const establishments = pgTable('establishments', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  password: varchar('password', { length: 255 }),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  address: text('address'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  workingHours: varchar('working_hours', { length: 255 }),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  boundTo: varchar('bound_to', { length: 255 })
    .default(sql`encode(gen_random_bytes(110), 'hex')`)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  status: varchar('status', { length: 20 })
    .generatedAlwaysAs(
      sql`CASE 
      WHEN name IS NOT NULL 
       AND address IS NOT NULL
       AND boundTO IS NOT NULL 
      THEN 'Active' 
      ELSE 'Inactive' 
    END`
    )
    .notNull(),
});
