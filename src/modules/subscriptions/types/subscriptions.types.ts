import { UserType } from '../../auth/types/auth.types';

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum SubscriptionTarget {
  USER = 'user',
  ESTABLISHMENT = 'establishment',
  BOTH = 'both',
}

export interface CreateSubscriptionOrderDto {
  subscriptionPlanId: string;
}

export interface CaptureSubscriptionOrderDto {
  orderId: string;
}

export interface AccessTokenResponse {
  access_token: string;
  [key: string]: unknown;
}

export interface CreateOrderResponse {
  id: string;
  [key: string]: unknown;
}

export interface PayPalOrderDetails {
  id: string;
  status: string;
  createTime: string;
  updateTime?: string;
  payer?: {
    email_address?: string;
    [key: string]: unknown;
  };
}

export interface CaptureOrderResponse
  extends Omit<PayPalOrderDetails, 'createTime' | 'updateTime'> {
  create_time: string;
  update_time: string;
  [key: string]: unknown;
}

export interface GetSubscriptionInfoParams {
  userId?: string;
  establishmentId?: string;
}

export interface CreateSubscriptionOrderParams {
  dto: CreateSubscriptionOrderDto;
  targetId: string;
  targetType: UserType;
}

export interface CancelSubscriptionParams {
  targetId: string;
  targetType: UserType;
}
