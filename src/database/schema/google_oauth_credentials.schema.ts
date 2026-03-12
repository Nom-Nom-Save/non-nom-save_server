import { pgTable, uuid, text, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';
import { establishments } from './establishments.schema';

export const googleOauthCredentials = pgTable(
  'google_oauth_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    establishmentId: uuid('establishment_id')
      .unique()
      .references(() => establishments.id, { onDelete: 'cascade' }),
    googleId: text('google_id').notNull().unique(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    exclusiveOwnerCheck: check(
      'google_oauth_exclusive_owner_check',
      sql`num_nonnulls(${table.userId}, ${table.establishmentId}) = 1`
    ),
  })
);
