import { db } from '../../database';
import { subscriptionPlans } from '../../database/schema/subscription_plans.schema';
import { subscriptions } from '../../database/schema/subscriptions.schema';
import { users } from '../../database/schema/users.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { sendSubscriptionSuccessEmail } from '../email/email.service';
import { getAccessToken, paypalClient } from './paypal.util';
import { eq, or, and } from 'drizzle-orm';
import { UserType } from '../auth/types/auth.types';
import {
  CreateSubscriptionOrderDto,
  CreateOrderResponse,
  CaptureOrderResponse,
  GetSubscriptionInfoParams,
  SubscriptionStatus,
  SubscriptionTarget,
  CreateSubscriptionOrderParams,
  CancelSubscriptionParams,
  CaptureSubscriptionOrderResponse,
} from './types/subscriptions.types';
import { SubscriptionInfo } from '../../shared/types/subscription.type';

// Комменты пока не трогать, пожалуйста, потом удалю.

export const getSubscriptionInfo = async ({
  userId,
  establishmentId,
}: GetSubscriptionInfoParams): Promise<SubscriptionInfo | null> => {
  const whereClause = userId
    ? eq(subscriptions.userId, userId)
    : establishmentId
      ? eq(subscriptions.establishmentId, establishmentId)
      : null;

  if (!whereClause) return null;

  const [result] = await db
    .select({
      status: subscriptions.status,
      planName: subscriptionPlans.name,
      endDate: subscriptions.endDate,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.subscriptionPlanId, subscriptionPlans.id))
    .where(and(whereClause, eq(subscriptions.status, SubscriptionStatus.ACTIVE)));

  if (result) {
    return result as SubscriptionInfo;
  }

  // бесплатная подписка
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  return {
    status: SubscriptionStatus.ACTIVE,
    planName: 'Free plan',
    endDate: defaultEndDate,
  };
};

export const getSubscriptionPlans = async (targetType?: UserType) => {
  if (!targetType) {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  const target =
    targetType === UserType.USER ? SubscriptionTarget.USER : SubscriptionTarget.ESTABLISHMENT;

  return await db
    .select()
    .from(subscriptionPlans)
    .where(
      and(
        eq(subscriptionPlans.isActive, true),
        or(
          eq(subscriptionPlans.targetType, target),
          eq(subscriptionPlans.targetType, SubscriptionTarget.BOTH)
        )
      )
    );
};

export async function createSubscriptionOrder({
  dto,
  targetId,
  targetType,
}: CreateSubscriptionOrderParams) {
  const { subscriptionPlanId } = dto;
  const PAYPAL_API = process.env.PAYPAL_API!;
  const activeSub = await getSubscriptionInfo({
    userId: targetType === UserType.USER ? targetId : undefined,
    establishmentId: targetType === UserType.ESTABLISHMENT ? targetId : undefined,
  });

  if (activeSub && activeSub.planName !== 'Free plan') {
    throw new Error('You already have an active subscription');
  }

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
    status: SubscriptionStatus.PENDING,
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

export async function captureSubscriptionOrder(
  orderId: string
): Promise<CaptureSubscriptionOrderResponse> {
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

    //const customerEmail = orderDetails.payer?.email_address;

    let targetEmail: string | null = null;
    if (sub.userId) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, sub.userId));
      if (user) targetEmail = user.email;
    } else if (sub.establishmentId) {
      const [establishment] = await db
        .select({ email: establishments.email })
        .from(establishments)
        .where(eq(establishments.id, sub.establishmentId));
      if (establishment) targetEmail = establishment.email;
    }

    const now = new Date();
    let startDate = sub.startDate;
    let endDate = sub.endDate;

    if (orderDetails.status === 'COMPLETED') {
      // 4. Активируем подписку
      startDate = now;
      endDate = new Date(now);
      endDate.setDate(now.getDate() + Number(plan.durationDays));

      await db
        .update(subscriptions)
        .set({
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      if (targetEmail) {
        await sendSubscriptionSuccessEmail(targetEmail, orderDetails, plan.id);
      }
    }

    return {
      status: orderDetails.status,
      id: orderDetails.id,
      subscriptionName: plan.name,
      description: plan.description,
      price: plan.price,
      startDate,
      endDate,
    };
  } catch (error: unknown) {
    let errorMessage = 'Failed to capture PayPal subscription order';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'data' in error.response &&
      typeof error.response.data === 'object' &&
      error.response.data !== null &&
      'message' in error.response.data &&
      typeof error.response.data.message === 'string'
    ) {
      errorMessage = error.response.data.message;
    }

    console.error('Failed to capture subscription order:', error);
    throw new Error(errorMessage);
  }
}

export async function cancelSubscription({ targetId, targetType }: CancelSubscriptionParams) {
  const whereClause =
    targetType === UserType.USER
      ? eq(subscriptions.userId, targetId)
      : eq(subscriptions.establishmentId, targetId);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(whereClause, eq(subscriptions.status, SubscriptionStatus.ACTIVE)));

  if (!sub) {
    throw new Error('No active subscription found to cancel');
  }

  await db
    .update(subscriptions)
    .set({
      status: SubscriptionStatus.CANCELLED,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));

  return { message: 'Subscription cancelled successfully' };
}
