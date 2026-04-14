import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import * as reviewsService from './reviews.service';
import { CreateReviewInput, UpdateReviewInput } from './types/reviews.type';
import { handleError } from '../../shared/utils/app.error';
import { SortOrder } from '../../shared/types/common.types';
import { PaginationParams } from '../../shared/types/pagination.type';

export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const input: CreateReviewInput = req.body;

    const result = await reviewsService.createReview(userId, input);

    res.status(201).json({
      message: 'Review created successfully',
      ...result,
    });
  } catch (error: unknown) {
    handleError(res, error);
  }
};

export const getEstablishmentReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { establishmentId } = req.params;
    const { page, limit } = req.query;
    const sort = (req.query.sort as SortOrder) ?? SortOrder.ASC;
    const ratingFilter = req.query.ratingFilter && +req.query.ratingFilter;
    const user = req.user;
    const currentUserId = (user?.role as string) === 'user' ? user?.id : undefined;

    const pagination: Required<PaginationParams> = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    const { reviews, total, myReview } = await reviewsService.getEstablishmentReviews({
      establishmentId: establishmentId as string,
      sort,
      pagination,
      currentUserId,
      ratingFilter,
    });

    res.status(200).json({
      reviews,
      myReview,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error: unknown) {
    handleError(res, error);
  }
};

export const getReviewsDistribution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { establishmentId } = req.params;

    const { rating, ratingDistribution } = await reviewsService.getReviewsDistribution(
      establishmentId as string
    );

    res.status(200).json({ rating, ratingDistribution });
  } catch (error) {
    handleError(res, error);
  }
};

export const getMyReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page, limit } = req.query;

    const pagination: Required<PaginationParams> = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    const { reviews, total } = await reviewsService.getUserReviews(userId, pagination);

    res.status(200).json({
      reviews,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error: unknown) {
    handleError(res, error);
  }
};

export const getUserReviewsForEstablishment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { establishmentId } = req.params;
    const sort = (req.query.sort as SortOrder) ?? SortOrder.ASC;
    const ratingFilter = req.query.ratingFilter && +req.query.ratingFilter;

    if (typeof establishmentId !== 'string') {
      res.status(400).json({ message: 'Invalid establishmentId' });
      return;
    }

    const reviews = await reviewsService.getUserReviewsForEstablishment({
      userId,
      establishmentId,
      sort,
      ratingFilter,
    });

    res.status(200).json({ reviews });
  } catch (error: unknown) {
    handleError(res, error);
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reviewId } = req.params;
    const input: UpdateReviewInput = req.body;

    if (typeof reviewId !== 'string') {
      res.status(400).json({ message: 'Invalid reviewId' });
      return;
    }

    const result = await reviewsService.updateReview(userId, reviewId, input);

    res.status(200).json({
      message: 'Review updated successfully',
      ...result,
    });
  } catch (error: unknown) {
    handleError(res, error);
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reviewId } = req.params;

    if (typeof reviewId !== 'string') {
      res.status(400).json({ message: 'Invalid reviewId' });
      return;
    }

    const result = await reviewsService.deleteReview(userId, reviewId);

    res.status(200).json({
      message: 'Review deleted successfully',
      ...result,
    });
  } catch (error: unknown) {
    handleError(res, error);
  }
};
