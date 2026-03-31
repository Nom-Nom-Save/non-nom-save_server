import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import * as reviewsService from './reviews.service';
import { CreateReviewInput, UpdateReviewInput } from './types/reviews.type';
import { handleError } from '../../shared/utils/app.error';

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
