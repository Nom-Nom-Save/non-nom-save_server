import { pgTable, uuid, text, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';
import { establishments } from './establishments.schema';

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    establishmentId: uuid('establishment_id').references(() => establishments.id, {
      onDelete: 'cascade',
    }),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  table => ({
    mutuallyExclusiveCheck: check(
      'exclusive_owner_check',
      sql`num_nonnulls(${table.userId}, ${table.establishmentId}) = 1`
    ),
  })
);
