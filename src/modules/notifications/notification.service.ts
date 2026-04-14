import admin from 'firebase-admin';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { orders } from '../../database/schema/orders.schema';
import { users } from '../../database/schema/users.schema';
import { favoriteEstablishments } from '../../database/schema/favorite_establishments.schema';
import { eq, sql, and } from 'drizzle-orm';
import { transporter } from '../email/email.service';

if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export class NotificationService {
  static async sendEmail(to: string, subject: string, html: string) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
    }
  }

  static async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    const message: admin.messaging.Message = {
      topic,
      data: {
        title,
        body,
        ...(data || {}),
      },
    };

    try {
      return await admin.messaging().send(message);
    } catch (error) {
      console.error(`Error sending message to topic ${topic}:`, error);
    }
  }

  static async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    const message: admin.messaging.Message = {
      token,
      data: {
        title,
        body,
        ...(data || {}),
      },
    };

    try {
      return await admin.messaging().send(message);
    } catch (error) {
      console.error(`Error sending message to token:`, error);
    }
  }

  static async checkAndNotifyClosingSoon() {
    try {
      const currentDay = sql`CASE extract(dow from now() at time zone 'utc') 
        WHEN 0 THEN 'sun' WHEN 1 THEN 'mon' WHEN 2 THEN 'tue' 
        WHEN 3 THEN 'wed' WHEN 4 THEN 'thu' WHEN 5 THEN 'fri' 
        WHEN 6 THEN 'sat' END`;

      const currentTime = sql`(now() at time zone 'utc')::time`;
      const regex = sql`(${currentDay} || '=([0-9:]{4,5})-([0-9:]{4,5})')`;

      const closingSoonEstablishments = await db
        .select({
          id: establishments.id,
          name: establishments.name,
        })
        .from(establishments)
        .where(
          and(
            eq(establishments.isEmailVerified, true),
            sql`${establishments.workingHours} ~ ${regex}`,
            sql`((regexp_match(${establishments.workingHours}, ${regex}))[2])::time - ${currentTime} BETWEEN '00:45:00'::interval AND '01:15:00'::interval`
          )
        );

      for (const est of closingSoonEstablishments) {
        await this.sendToTopic(
          `closing_soon_${est.id}`,
          'Closing soon!',
          `${est.name} is closing in about an hour. Last chance to grab an offer!`
        );

        const subscribers = await db
          .select({ email: users.email })
          .from(users)
          .innerJoin(favoriteEstablishments, eq(favoriteEstablishments.userId, users.id))
          .where(
            and(
              eq(favoriteEstablishments.establishmentId, est.id),
              eq(users.notifyClosingSoon, true)
            )
          );

        for (const sub of subscribers) {
          await this.sendEmail(
            sub.email,
            'Closing soon!',
            `<h3>Hurry up!</h3><p>${est.name} is closing in about an hour. Don't miss your chance to grab an offer!</p>`
          );
        }
      }
    } catch (error) {
      console.error('Error in checkAndNotifyClosingSoon:', error);
    }
  }

  static async checkAndNotifyExpiringOrders() {
    try {
      const currentTime = sql`timezone('utc', now())`;

      const expiringOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          userEmail: users.email,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(
          and(
            eq(orders.orderStatus, 'Pending'),
            sql`${orders.expiresAt} - ${currentTime} BETWEEN '00:45:00'::interval AND '01:15:00'::interval`
          )
        );

      for (const order of expiringOrders) {
        await this.sendToTopic(
          `user_orders_${order.userId}`,
          'Order expiring!',
          `Your order #${order.id.slice(0, 8)} will expire in about an hour. Don't forget to pick it up!`
        );

        await this.sendEmail(
          order.userEmail,
          'Your order is expiring!',
          `<h3>Don't forget your order!</h3><p>Your order <strong>#${order.id.slice(0, 8)}</strong> will expire in about an hour. Please pick it up soon.</p>`
        );
      }
    } catch (error) {
      console.error('Error in checkAndNotifyExpiringOrders:', error);
    }
  }

  static async getEstablishmentName(establishmentId: string): Promise<string> {
    const [result] = await db
      .select({ name: establishments.name })
      .from(establishments)
      .where(eq(establishments.id, establishmentId));
    return result?.name || 'Establishment';
  }
}
