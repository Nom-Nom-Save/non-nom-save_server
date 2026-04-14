import { Router } from 'express';
import {
  getUser,
  updateUserProfile,
  getMe,
  addToFavorites,
  removeFromFavorites,
  getMyFavorites,
} from './users.controller';
import { userAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/me', userAuth, getMe);
router.get('/favorites', userAuth, getMyFavorites);
router.post('/favorites', userAuth, addToFavorites);
router.delete('/favorites/:establishmentId', userAuth, removeFromFavorites);
router.get('/:userId', getUser);
router.patch('/:userId', userAuth, updateUserProfile);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionInfo:
 *       type: object
 *       properties:
 *         status: { type: string, example: "active" }
 *         planName: { type: string, example: "Premium Plan" }
 *         endDate: { type: string, format: date-time }
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         notifyNearby:
 *           type: boolean
 *         notifyClosingSoon:
 *           type: boolean
 *         notifyNewItems:
 *           type: boolean
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         email: { type: string }
 *         fullName: { type: string, nullable: true }
 *         isEmailVerified: { type: boolean }
 *         notifyNearby: { type: boolean }
 *         notifyClosingSoon: { type: boolean }
 *         notifyNewItems: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         successfulOrdersCount: { type: integer }
 *         totalSavings: { type: number }
 *         totalOrderedItems: { type: integer }
 *         subscription:
 *           $ref: '#/components/schemas/SubscriptionInfo'
 *           nullable: true
 *     Favorite:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         establishmentId: { type: string, format: uuid }
 *         createdAt: { type: string, format: date-time }
 *         establishment:
 *           type: object
 *           properties:
 *             name: { type: string, nullable: true }
 *             address: { type: string, nullable: true }
 *             logo: { type: string, nullable: true }
 *             banner: { type: string, nullable: true }
 *             rating: { type: string, nullable: true }
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get currently authenticated user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     summary: Get user favorite establishments (Paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1, default: 1 }
 *         description: Page number (Mandatory, defaults to 1)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10, default: 10 }
 *         description: Items per page (Mandatory, defaults to 10)
 *     responses:
 *       200:
 *         description: List of favorite establishments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Favorite' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add establishment to favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [establishmentId]
 *             properties:
 *               establishmentId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Establishment added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 establishmentId: { type: string, format: uuid }
 *       400:
 *         description: Bad request (e.g. missing establishmentId)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/favorites/{establishmentId}:
 *   delete:
 *     summary: Remove establishment from favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: establishmentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Establishment removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: Bad request (e.g. missing establishmentId)
 *       404:
 *         description: Favorite not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Bad request (e.g. missing userId)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Bad request (e.g. missing userId)
 *       403:
 *         description: Access denied (trying to edit someone else's profile)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
