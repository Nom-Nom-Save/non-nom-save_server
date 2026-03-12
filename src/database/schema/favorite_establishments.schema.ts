import { pgTable, uuid, text, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { establishments } from './establishments.schema';

export const favoriteEstablishments = pgTable('favorite_establishments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishments.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});
