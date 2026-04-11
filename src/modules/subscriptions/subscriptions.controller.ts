import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from './subscriptions.service';
import {
  CreateSubscriptionOrderDto,
  CaptureSubscriptionOrderDto,
} from './types/subscriptions.types';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export const getSubscriptionPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as AuthenticatedRequest).user?.role;
    const plans = await subscriptionService.getSubscriptionPlans(userRole);
    res.status(200).json(plans);
  } catch (error) {
    next(error);
  }
};

export const createSubscriptionOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto: CreateSubscriptionOrderDto = req.body;
    const authReq = req as AuthenticatedRequest;
    const targetId = authReq.user!.id;
    const targetType = authReq.user!.role;

    const order = await subscriptionService.createSubscriptionOrder(dto, targetId, targetType);
    res.status(201).json({ id: order.id });
  } catch (error) {
    next(error);
  }
};

export const captureSubscriptionOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId }: CaptureSubscriptionOrderDto = req.body;
    const result = await subscriptionService.captureSubscriptionOrder(orderId);
    res.status(200).json({ status: result.status, id: result.id });
  } catch (error) {
    next(error);
  }
};
