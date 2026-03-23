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
 *         fullName: { type: string }
 *         isEmailVerified: { type: boolean }
 *         notifyNearby: { type: boolean }
 *         notifyClosingSoon: { type: boolean }
 *         notifyNewItems: { type: boolean }
 *         createdAt: { type: string, format: date-time }
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
 *       200: { description: Success }
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
 *       200: { description: Success }
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
 *       201: { description: Added }
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
 *       200: { description: Removed }
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
 *       200: { description: Success }
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
 *     responses:
 *       200: { description: Updated }
 */
router.get('/:userId', getUser);
router.patch('/:userId', userAuth, updateUserProfile);

export default router;
