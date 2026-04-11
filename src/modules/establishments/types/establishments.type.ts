import { establishments } from '../../../database/schema/establishments.schema';
import { InferSelectModel } from 'drizzle-orm';
import { PaginationParams } from '../../../shared/types/pagination.type';
import { SortOrder } from '../../../shared/types/common.types';
import { SubscriptionInfo } from '../../../shared/types/subscription.type';

export type Establishment = InferSelectModel<typeof establishments> & {
  subscription?: SubscriptionInfo | null;
};

export type PublicEstablishment = {
  id: string;
  name: string | null;
  description: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  workingHours: string | null;
  logo: string | null;
  banner: string | null;
  rating: string | null;
  createdAt: Date | null;
  distance?: number | string | null;
  reviewCount: number;
};

export type UpdateEstablishmentInput = Partial<{
  name: string | null;
  email: string;
  description: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  workingHours: string | null;
  logo: string | null;
  banner: string | null;
  boundTo: string;
}>;

export interface EstablishmentFilterParams {
  city?: string;
  lat?: number;
  lon?: number;
  radius?: number;
  minRating?: number;
  productTypeIds?: string[];
}

export enum EstablishmentsSortBy {
  RATING = 'rating',
  DISTANCE = 'distance',
  CLOSING_TIME = 'closingTime',
}

export interface EstablishmentSortParams {
  sortBy?: EstablishmentsSortBy;
  sortOrder?: SortOrder;
}

export interface GetFilteredEstablishmentsParams {
  filters: EstablishmentFilterParams;
  sorting: EstablishmentSortParams;
  pagination?: PaginationParams;
}
