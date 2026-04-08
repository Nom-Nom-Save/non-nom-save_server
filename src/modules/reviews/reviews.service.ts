import { and, eq, sql, avg, count, asc, desc, gt } from 'drizzle-orm';
import { db } from '../../database';
import { reviews } from '../../database/schema/reviews.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { users } from '../../database/schema/users.schema';
import {
  CreateReviewInput,
  UpdateReviewInput,
  GetEstablishmentReviewsParams,
  GetUserReviewsForEstablishmentParams,
  Review,
  MyReview,
  RatingDistributionItem,
} from './types/reviews.type';
import { getEstablishmentById } from '../establishments/establishments.service';
import { AppError } from '../../shared/utils/app.error';
import { PaginationParams } from '../../shared/types/pagination.type';
import { SortOrder } from '../../shared/types/common.types';
import { getEditableUntil } from '../../shared/utils/review.util';

export const getEstablishmentReviews = async ({
  establishmentId,
  sort = SortOrder.DESC,
  pagination,
  currentUserId,
  ratingFilter,
}: GetEstablishmentReviewsParams): Promise<{
  reviews: Review[];
  total: number;
  myReview?: MyReview;
}> => {
  const baseWhere = eq(reviews.establishmentId, establishmentId);
  const listWhere = ratingFilter ? and(baseWhere, eq(reviews.rating, ratingFilter)) : baseWhere;

  const orderByClause = sort === SortOrder.ASC ? asc(reviews.createdAt) : desc(reviews.createdAt);

  const totalCountResult = await db.select({ count: count() }).from(reviews).where(baseWhere);
  const total = totalCountResult[0]?.count || 0;

  let myReview = undefined;
  if (currentUserId) {
    const [userReview] = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(and(baseWhere, eq(reviews.userId, currentUserId)))
      .orderBy(desc(reviews.createdAt))
      .limit(1);

    if (userReview) {
      const editableUntil = getEditableUntil(userReview.createdAt);

      myReview = {
        ...userReview,
        editableUntil,
        isEditable: new Date() < editableUntil,
      };
    }
  }

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
    .where(listWhere)
    .orderBy(orderByClause);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const results = await query;

  const formattedResults = results.map(review => {
    const editableUntil = getEditableUntil(review.createdAt);

    return {
      ...review,
      editableUntil,
    };
  });

  return {
    reviews: formattedResults,
    total,
    myReview,
  };
};

export const getReviewsDistribution = async (
  establishmentId: string
): Promise<{
  rating: string;
  ratingDistribution: RatingDistributionItem[];
}> => {
  const whereClause = eq(reviews.establishmentId, establishmentId);

  const totalCountResult = await db.select({ count: count() }).from(reviews).where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  const [establishment] = await db
    .select({ rating: establishments.rating })
    .from(establishments)
    .where(eq(establishments.id, establishmentId));

  const distributionResult = await db
    .select({
      rating: reviews.rating,
      count: count(),
    })
    .from(reviews)
    .where(whereClause)
    .groupBy(reviews.rating);

  const distribution = [1, 2, 3, 4, 5].map(star => {
    const found = distributionResult.find(d => d.rating === star);
    const countVal = found?.count || 0;
    return {
      rating: star,
      count: countVal,
      percentage: total > 0 ? parseFloat(((countVal / total) * 100).toFixed(2)) : 0,
    };
  });

  return {
    rating: establishment?.rating || '0.00',
    ratingDistribution: distribution,
  };
};

export const getUserReviews = async (
  userId: string,
  pagination?: PaginationParams
): Promise<{ reviews: Review[]; total: number }> => {
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

  const formattedResults = results.map(review => {
    const editableUntil = getEditableUntil(review.createdAt);

    return {
      ...review,
      editableUntil,
      isEditable: new Date() < editableUntil,
    };
  });

  return { reviews: formattedResults, total };
};

export const getUserReviewsForEstablishment = async ({
  userId,
  establishmentId,
  sort = SortOrder.DESC,
  ratingFilter,
}: GetUserReviewsForEstablishmentParams): Promise<MyReview[]> => {
  const orderByClause = sort === SortOrder.ASC ? asc(reviews.createdAt) : desc(reviews.createdAt);
  const userReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.establishmentId, establishmentId),
        ratingFilter ? eq(reviews.rating, ratingFilter) : undefined
      )
    )
    .orderBy(orderByClause);

  return userReviews.map(review => {
    const editableUntil = getEditableUntil(review.createdAt);

    return {
      ...review,
      editableUntil,
      isEditable: new Date() < editableUntil,
    };
  });
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
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const recentReview = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.establishmentId, input.establishmentId),
        gt(reviews.createdAt, oneDayAgo)
      )
    );

  if (recentReview.length > 0) {
    throw new AppError('You can only review the same establishment once a day', 400);
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

  const editableUntil = new Date(newReview.createdAt);

  return {
    review: { ...newReview, editableUntil },
    updatedEstablishment,
  };
};

export const updateReview = async (userId: string, reviewId: string, input: UpdateReviewInput) => {
  const [existingReview] = await db.select().from(reviews).where(eq(reviews.id, reviewId));

  if (!existingReview) {
    throw new AppError('Review not found', 404);
  }

  if (existingReview.userId !== userId) {
    throw new AppError('You can only update your own reviews', 403);
  }

  const now = new Date();
  const createdAt = new Date(existingReview.createdAt);
  const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (diffInHours > 24) {
    throw new AppError('Reviews can only be edited within 24 hours of creation', 400);
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

  const editableUntil = getEditableUntil(updatedReview.createdAt);

  return {
    review: { ...updatedReview, editableUntil },
    updatedEstablishment,
  };
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
