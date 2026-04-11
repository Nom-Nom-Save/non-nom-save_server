import { users } from '../../../database/schema/users.schema';
import { favoriteEstablishments } from '../../../database/schema/favorite_establishments.schema';
import { InferSelectModel } from 'drizzle-orm';

import { SubscriptionInfo } from '../../../shared/types/subscription.type';

export interface UserStats {
  successfulOrdersCount: number;
  totalSavings: number;
  totalOrderedItems: number;
}

export type User = Omit<InferSelectModel<typeof users>, 'password'> &
  Partial<UserStats> & { subscription?: SubscriptionInfo | null };

export type Favorite = InferSelectModel<typeof favoriteEstablishments>;

export type UpdateUserInput = Partial<{
  fullName: string | null;
  email: string;
  notifyNearby: boolean;
  notifyClosingSoon: boolean;
  notifyNewItems: boolean;
}>;

export interface EstablishmentFavoriteInfo {
  name: string | null;
  address: string | null;
  logo: string | null;
  banner: string | null;
  rating: string | null;
}

export type FavoriteWithDetails = Favorite & {
  establishment: EstablishmentFavoriteInfo;
};

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface UserResponse {
  message: string;
  user: User;
}

export interface FavoritesResponse {
  favorites: FavoriteWithDetails[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
