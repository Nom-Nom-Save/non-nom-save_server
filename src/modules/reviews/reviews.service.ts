import { and, eq, sql, avg, count } from 'drizzle-orm';
import { db } from '../../database';
import { reviews } from '../../database/schema/reviews.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { users } from '../../database/schema/users.schema';
import { CreateReviewInput, UpdateReviewInput, Review } from './types/reviews.type';
import { getEstablishmentById } from '../establishments/establishments.service';
import { AppError } from '../../shared/utils/app.error';
import { PaginationParams } from '../../shared/types/pagination.type';

export const getEstablishmentReviews = async (
  establishmentId: string,
  pagination?: PaginationParams
): Promise<{ reviews: any[]; total: number }> => {
  const whereClause = eq(reviews.establishmentId, establishmentId);

  const totalCountResult = await db.select({ count: count() }).from(reviews).where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(whereClause)
    .orderBy(sql`${reviews.createdAt} DESC`);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const results = await query;
  return { reviews: results, total };
};

export const getUserReviews = async (
  userId: string,
  pagination?: PaginationParams
): Promise<{ reviews: any[]; total: number }> => {
  const whereClause = eq(reviews.userId, userId);

  const totalCountResult = await db.select({ count: count() }).from(reviews).where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      establishment: {
        id: establishments.id,
        name: establishments.name,
      },
    })
    .from(reviews)
    .innerJoin(establishments, eq(reviews.establishmentId, establishments.id))
    .where(whereClause)
    .orderBy(sql`${reviews.createdAt} DESC`);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const results = await query;
  return { reviews: results, total };
};

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
