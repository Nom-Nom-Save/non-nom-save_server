import { establishments } from '../../../database/schema/establishments.schema';
import { InferSelectModel } from 'drizzle-orm';

export type Establishment = InferSelectModel<typeof establishments>;

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

export interface EstablishmentSortParams {
  sortBy?: 'rating' | 'distance' | 'closingTime';
  sortOrder?: 'asc' | 'desc';
}
