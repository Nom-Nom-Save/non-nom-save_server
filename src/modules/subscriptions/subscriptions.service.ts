import { db } from '../../database';
import { subscriptionPlans } from '../../database/schema/subscription_plans.schema';
import { subscriptions } from '../../database/schema/subscriptions.schema';
import { sendSubscriptionSuccessEmail } from '../email/email.service';
import { getAccessToken, paypalClient } from './paypal.util';
import { eq, or, and } from 'drizzle-orm';
import { UserType } from '../auth/types/auth.types';
import {
  CreateSubscriptionOrderDto,
  CreateOrderResponse,
  CaptureOrderResponse,
} from './types/subscriptions.types';

// Комменты пока не трогать, пожалуйста, потом удалю.

export const getSubscriptionPlans = async (targetType?: UserType) => {
  if (!targetType) {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  const target = targetType as string;

  return await db
    .select()
    .from(subscriptionPlans)
    .where(
      and(
        eq(subscriptionPlans.isActive, true),
        or(
          eq(subscriptionPlans.targetType, target as 'user' | 'establishment' | 'both'),
          eq(subscriptionPlans.targetType, 'both')
        )
      )
    );
};

export async function createSubscriptionOrder(
  dto: CreateSubscriptionOrderDto,
  targetId: string,
  targetType: UserType
) {
  const { subscriptionPlanId } = dto;
  const PAYPAL_API = process.env.PAYPAL_API!;

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscriptionPlanId));

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  const accessToken = await getAccessToken();

  const res = await paypalClient.post<CreateOrderResponse>(
    `${PAYPAL_API}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: plan.currency,
            value: plan.price,
            breakdown: {
              item_total: {
                currency_code: plan.currency,
                value: plan.price,
              },
            },
          },
          items: [
            {
              name: plan.name,
              unit_amount: {
                currency_code: plan.currency,
                value: plan.price,
              },
              quantity: '1',
              description: plan.description || `Subscription for ${plan.name}`,
              category: 'DIGITAL_GOODS',
            },
          ],
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'NonNomSave',
            locale: 'en-US',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: `${process.env.FRONTEND_URL}/complete-subscription`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel-subscription`,
          },
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const orderId = res.data.id;

  // Создаем/обновляем запись подписки со статусом pending
  const now = new Date();
  const subscriptionData: Omit<typeof subscriptions.$inferInsert, 'id' | 'createdAt'> = {
    subscriptionPlanId,
    paypalSubscriptionId: orderId,
    status: 'pending' as const,
    startDate: now, // Временно ставим сейчас, обновим при активации
    endDate: now, // Временно ставим сейчас, обновим при активации
    updatedAt: now,
  };

  if (targetType === UserType.USER) {
    await db
      .insert(subscriptions)
      .values({ ...subscriptionData, userId: targetId, createdAt: now })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: subscriptionData,
      });
  } else {
    await db
      .insert(subscriptions)
      .values({ ...subscriptionData, establishmentId: targetId, createdAt: now })
      .onConflictDoUpdate({
        target: subscriptions.establishmentId,
        set: subscriptionData,
      });
  }

  return res.data;
}

export async function captureSubscriptionOrder(orderId: string) {
  const accessToken = await getAccessToken();
  const PAYPAL_API = (process.env.PAYPAL_API || '').trim();

  // 1. Ищем запись подписки по orderId
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.paypalSubscriptionId, orderId));

  if (!sub || !sub.subscriptionPlanId) {
    throw new Error('Pending subscription not found or invalid for this order');
  }

  // 2. Получаем детали плана
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, sub.subscriptionPlanId));

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  try {
    // 3. Захватываем оплату в PayPal
    const res = await paypalClient.post<CaptureOrderResponse>(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const orderDetails = {
      id: res.data.id,
      status: res.data.status,
      createTime: res.data.create_time,
      updateTime: res.data.update_time,
      payer: res.data.payer,
    };

    const customerEmail = orderDetails.payer?.email_address;

    if (orderDetails.status === 'COMPLETED') {
      // 4. Активируем подписку
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + Number(plan.durationDays));

      await db
        .update(subscriptions)
        .set({
          status: 'active',
          startDate: now,
          endDate,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      if (customerEmail) {
        await sendSubscriptionSuccessEmail(customerEmail, orderDetails, plan.id);
      }
    }

    return orderDetails;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    console.error('Failed to capture subscription order:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Failed to capture PayPal subscription order');
  }
}
