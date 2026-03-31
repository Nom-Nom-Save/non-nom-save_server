export interface Review {
  id: string;
  userId: string;
  establishmentId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
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
