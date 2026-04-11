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
