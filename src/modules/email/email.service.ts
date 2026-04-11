import nodemailer from 'nodemailer';
import { db } from '../../database';
import { eq } from 'drizzle-orm';
import { subscriptionPlans } from '../../database/schema/subscription_plans.schema';
import { subscriptions } from '../../database/schema/subscriptions.schema';
import { PayPalOrderDetails } from '../subscriptions/types/subscriptions.types';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (to: string, code: string) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="margin:0 0 0 0;color:#1a3326;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Verify your email address</h1>
        <p>Your verification code is:</p>
        <div style="background-color: #f0ede4; border: 2px dashed #2D6A4F; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="margin:0;color:#2d5c3e;font-size:40px;font-weight:700;letter-spacing:14px;font-family:'Courier New',monospace;">${code}</p>
        </div>
        <div style="margin-top: 0px;background-color:#fff8e7;border-left:3px solid #e8a020;border-radius:0 8px 8px 0;padding:11px 14px;">
          <p style="margin:0;color:#7a5c10;font-size:13px;">⏱ This code expires in <strong>1 hour</strong></p>
        </div>
        <p style="color:#a0a89e;font-size:12px;line-height:1.6;">
          If you didn't create an account, you can safely ignore this email. No action is required.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Email Verification Code',
      html,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
    }

    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetCode = async (to: string, code: string) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="margin:0 0 0 0;color:#1a3326;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Password Reset Request</h1>
        <p>We received a request to reset the password for your account. Enter the code below to proceed:</p>
        <div style="background-color: #f0ede4; border: 2px dashed #2D6A4F; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="margin:0;color:#2d5c3e;font-size:40px;font-weight:700;letter-spacing:14px;font-family:'Courier New',monospace;">${code}</p>
        </div>
        <div style="margin-top: 0px;background-color:#fff8e7;border-left:3px solid #e8a020;border-radius:0 8px 8px 0;padding:11px 14px;">
          <p style="margin:0;color:#7a5c10;font-size:13px;">⏱ This code expires in <strong>1 hour</strong></p>
        </div>
        <p style="color:#a0a89e;font-size:12px;line-height:1.6;">
          If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
        </p>
      </div>
    `;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Password Reset Code',
      html,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
    }
    throw new Error('Failed to send password reset email');
  }
};

export const sendSubscriptionSuccessEmail = async (
  to: string,
  orderDetails: PayPalOrderDetails,
  subscriptionPlanId: string
) => {
  try {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscriptionPlanId));
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paypalSubscriptionId, orderDetails.id));

    if (!plan || !subscription) {
      console.warn('Plan or subscription not found for email:', {
        subscriptionPlanId,
        orderId: orderDetails.id,
      });
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ccc; border-radius: 8px;">
        <h1 style="color: #2e6da4;">Subscription Successfully Activated</h1>
        <p>Hi there,</p>
        <p>Thank you for purchasing the <strong>${plan.name}</strong> plan.</p>

        <h2>🧾 Order Info</h2>
        <ul>
          <li><strong>Order ID:</strong> ${orderDetails.id}</li>
          <li><strong>Status:</strong> ${orderDetails.status}</li>
          <li><strong>Date:</strong> ${new Date(orderDetails.createTime).toLocaleString()}</li>
        </ul>

        <h2>📋 Plan Details</h2>
        <ul>
          <li><strong>Name:</strong> ${plan.name}</li>
          <li><strong>Description:</strong> ${plan.description || 'No description'}</li>
          <li><strong>Price:</strong> ${plan.price} ${plan.currency}</li>
          <li><strong>Duration:</strong> ${plan.durationDays} days</li>
        </ul>

        <h2>📆 Subscription Info</h2>
        <ul>
          <li><strong>Status:</strong> ${subscription.status}</li>
          <li><strong>Start Date:</strong> ${new Date(subscription.startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(subscription.endDate).toLocaleDateString()}</li>
        </ul>

        <p>If you have any questions, feel free to contact our support.</p>
        <p>Best regards,<br/>The NonNom Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `🎉 Subscription Activated - ${plan.name}`,
      html,
    });
  } catch (error) {
    console.error('Error sending subscription success email:', error);
  }
};
