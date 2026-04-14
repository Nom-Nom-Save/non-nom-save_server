import { Router } from 'express';
import { handleNearbyNotification } from './notifications.controller';

const router = Router();

router.post('/nearby', handleNearbyNotification);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Push notification services
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
