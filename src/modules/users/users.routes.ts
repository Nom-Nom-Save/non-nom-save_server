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

/**
 * @swagger
 * components:
 *   schemas:
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
router.get('/me', userAuth, getMe);

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     summary: Get user favorite establishments
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *       400:
 *         description: Bad request (e.g. missing establishmentId)
 *       500:
 *         description: Internal server error
 */
router.get('/favorites', userAuth, getMyFavorites);
router.post('/favorites', userAuth, addToFavorites);

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
router.delete('/favorites/:establishmentId', userAuth, removeFromFavorites);

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
router.get('/:userId', getUser);
router.patch('/:userId', userAuth, updateUserProfile);

export default router;
