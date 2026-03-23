import { users } from '../../../database/schema/users.schema';
import { favoriteEstablishments } from '../../../database/schema/favorite_establishments.schema';
import { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type Favorite = InferSelectModel<typeof favoriteEstablishments>;

export type UpdateUserInput = Partial<{
  fullName: string | null;
  email: string;
  notifyNearby: boolean;
  notifyClosingSoon: boolean;
  notifyNewItems: boolean;
}>;

export type FavoriteWithDetails = Favorite & {
  establishment: {
    name: string | null;
    address: string | null;
  };
};
