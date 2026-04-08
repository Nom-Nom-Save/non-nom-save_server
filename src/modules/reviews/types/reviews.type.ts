import { SortOrder } from '../../../shared/types/common.types';
import { PaginationParams } from '../../../shared/types/pagination.type';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user?: {
    id: string;
    fullName: string | null;
  };
  editableUntil: Date;
}

export interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  editableUntil: Date;
  isEditable: boolean;
}

export interface RatingDistributionItem {
  rating: number;
  count: number;
  percentage: number;
}

export interface CreateReviewInput {
  establishmentId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export type RatingFilter = 1 | 2 | 3 | 4 | 5;

export interface GetEstablishmentReviewsParams {
  establishmentId: string;
  pagination?: PaginationParams;
  currentUserId?: string;
  sort?: SortOrder;
  ratingFilter?: RatingFilter;
}

export interface GetUserReviewsForEstablishmentParams {
  userId: string;
  establishmentId: string;
  sort?: SortOrder;
  ratingFilter?: RatingFilter;
}
