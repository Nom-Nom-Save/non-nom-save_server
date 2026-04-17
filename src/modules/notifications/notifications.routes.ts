import { Router } from 'express';
import {
  handleNearbyNotification,
  handleTestNotification,
  handleTopicTestNotification,
} from './notifications.controller';

const router = Router();

router.post('/nearby', handleNearbyNotification);
router.post('/test', handleTestNotification);
router.post('/test-topic', handleTopicTestNotification);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Push notification services
 */

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Send test push notification
 *     description: Sends a test push notification to a specific device.
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *                 example: "fcm_token_xyz_123"
 *                 description: FCM Device Token obtained from Firebase SDK
 *               title:
 *                 type: string
 *                 example: "Test Title"
 *               body:
 *                 type: string
 *                 example: "Test message body"
 *     responses:
 *       200:
 *         description: Notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (missing fields)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/notifications/test-topic:
 *   post:
 *     summary: Send test push notification to topic
 *     description: Sends a test push notification to all devices subscribed to a topic.
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 example: "all_users"
 *                 description: FCM Topic name
 *               title:
 *                 type: string
 *                 example: "Topic Test Title"
 *               body:
 *                 type: string
 *                 example: "Topic test message body"
 *     responses:
 *       200:
 *         description: Notification sent to topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (missing fields)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/notifications/nearby:
 *   post:
 *     summary: Send "nearby" notification
 *     description: |
 *       Searches for active offers near the given coordinates and sends a push notification
 *       directly to the user's device.
 *       App should call this periodically in the background if user enabled "notifyNearby".
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lon
 *               - deviceToken
 *             properties:
 *               lat:
 *                 type: number
 *                 example: 55.7558
 *                 description: User's latitude
 *               lon:
 *                 type: number
 *                 example: 37.6173
 *                 description: User's longitude
 *               deviceToken:
 *                 type: string
 *                 example: "fcm_token_xyz_123"
 *                 description: FCM Device Token obtained from Firebase SDK
 *     responses:
 *       200:
 *         description: Success (notification sent if offers found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Bad request (missing fields)
 *       500:
 *         description: Internal server error
 */

export default router;
