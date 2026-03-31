import { and, eq, sql, avg } from 'drizzle-orm';
import { db } from '../../database';
import { reviews } from '../../database/schema/reviews.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { CreateReviewInput, UpdateReviewInput, Review } from './types/reviews.type';
import { getEstablishmentById } from '../establishments/establishments.service';
import { AppError } from '../../shared/utils/app.error';

export const updateEstablishmentRating = async (establishmentId: string) => {
  const [result] = await db
    .select({
      avgRating: avg(reviews.rating),
    })
    .from(reviews)
    .where(eq(reviews.establishmentId, establishmentId));

  const newRating = result?.avgRating ? parseFloat(result.avgRating).toFixed(2) : '0.00';

  await db
    .update(establishments)
    .set({ rating: newRating })
    .where(eq(establishments.id, establishmentId));

  return getEstablishmentById(establishmentId);
};

export const createReview = async (userId: string, input: CreateReviewInput) => {
  const existingReview = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.establishmentId, input.establishmentId)));

  if (existingReview.length > 0) {
    throw new AppError('You have already reviewed this establishment', 400);
  }

  const [newReview] = await db
    .insert(reviews)
    .values({
      userId,
      establishmentId: input.establishmentId,
      rating: input.rating,
      comment: input.comment || null,
    })
    .returning();

  const updatedEstablishment = await updateEstablishmentRating(input.establishmentId);

  return { review: newReview as Review, updatedEstablishment };
};

export const updateReview = async (userId: string, reviewId: string, input: UpdateReviewInput) => {
  const [existingReview] = await db.select().from(reviews).where(eq(reviews.id, reviewId));

  if (!existingReview) {
    throw new AppError('Review not found', 404);
  }

  if (existingReview.userId !== userId) {
    throw new AppError('You can only update your own reviews', 403);
  }

  const [updatedReview] = await db
    .update(reviews)
    .set({
      rating: input.rating ?? undefined,
      comment: input.comment ?? undefined,
    })
    .where(eq(reviews.id, reviewId))
    .returning();

  const updatedEstablishment = await updateEstablishmentRating(existingReview.establishmentId);

  return { review: updatedReview as Review, updatedEstablishment };
};

export const deleteReview = async (userId: string, reviewId: string) => {
  const [existingReview] = await db.select().from(reviews).where(eq(reviews.id, reviewId));

  if (!existingReview) {
    throw new AppError('Review not found', 404);
  }

  if (existingReview.userId !== userId) {
    throw new AppError('You can only delete your own reviews', 403);
  }

  await db.delete(reviews).where(eq(reviews.id, reviewId));

  const updatedEstablishment = await updateEstablishmentRating(existingReview.establishmentId);

  return { updatedEstablishment };
};
