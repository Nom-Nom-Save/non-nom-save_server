import { Router } from 'express';
import * as subscriptionController from './subscriptions.controller';
import { auth, optionalAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     summary: Get subscription plans filtered by user type
 *     description: Returns plans available for the authenticated user/establishment. If not authenticated, returns all active plans.
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "plan-uuid-1234"
 *                   name:
 *                     type: string
 *                     example: "Pro Plan"
 *                   description:
 *                     type: string
 *                     example: "Access to premium features"
 *                   price:
 *                     type: string
 *                     example: "9.99"
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *                   durationDays:
 *                     type: integer
 *                     example: 30
 *                   isActive:
 *                     type: boolean
 *                     example: true
 *                   targetType:
 *                     type: string
 *                     enum: [user, establishment, both]
 *                     example: "establishment"
 *       500:
 *         description: Failed to fetch subscription plans
 */
router.get('/plans', optionalAuth, subscriptionController.getSubscriptionPlans);

/**
 * @swagger
 * /subscriptions/create-order:
 *   post:
 *     summary: Create a PayPal subscription order
 *     description: Takes a subscriptionPlanId and creates a PayPal order with the correct amount and details from the database.
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionPlanId
 *             properties:
 *               subscriptionPlanId:
 *                 type: string
 *                 example: "plan-uuid-1234"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "5O1234567890"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.post('/create-order', auth, subscriptionController.createSubscriptionOrder);

/**
 * @swagger
 * /subscriptions/capture-order:
 *   post:
 *     summary: Capture a PayPal subscription order and activate subscription
 *     description: Takes only the orderId. Finds the pending subscription record, captures payment from PayPal, and activates the subscription.
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "1AB23456CD7890123"
 *     responses:
 *       200:
 *         description: Order captured and subscription created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "COMPLETED"
 *                 id:
 *                   type: string
 *                   example: "1AB23456CD7890123"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Pending subscription or plan not found
 *       500:
 *         description: Failed to capture PayPal subscription order
 */
router.post('/capture-order', auth, subscriptionController.captureSubscriptionOrder);

export default router;
