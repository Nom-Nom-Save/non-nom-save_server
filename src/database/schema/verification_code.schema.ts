import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { establishments } from './establishments.schema';

export const verificationCode = pgTable('verification_code', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  establishmentId: uuid('establishment_id').references(() => establishments.id, {
    onDelete: 'cascade',
  }),
  code: varchar('code', { length: 4 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
