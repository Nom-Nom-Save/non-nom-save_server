import { Router } from 'express';
import * as reviewsController from './reviews.controller';
import { userAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         establishmentId: { type: string, format: uuid }
 *         rating: { type: integer, minimum: 1, maximum: 5 }
 *         comment: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *     CreateReviewInput:
 *       type: object
 *       required: [establishmentId, rating]
 *       properties:
 *         establishmentId: { type: string, format: uuid }
 *         rating: { type: integer, minimum: 1, maximum: 5 }
 *         comment: { type: string }
 *     UpdateReviewInput:
 *       type: object
 *       properties:
 *         rating: { type: integer, minimum: 1, maximum: 5 }
 *         comment: { type: string }
 *     PublicEstablishment:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, nullable: true }
 *         description: { type: string, nullable: true }
 *         address: { type: string, nullable: true }
 *         latitude: { type: string, nullable: true }
 *         longitude: { type: string, nullable: true }
 *         workingHours: { type: string, nullable: true }
 *         logo: { type: string, nullable: true }
 *         banner: { type: string, nullable: true }
 *         rating: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time, nullable: true }
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review for an establishment
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 review: { $ref: '#/components/schemas/Review' }
 *                 updatedEstablishment: { $ref: '#/components/schemas/PublicEstablishment' }
 *       400:
 *         description: Bad request (e.g. already reviewed)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', userAuth, reviewsController.createReview as any);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   patch:
 *     summary: Update an existing review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewInput'
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 review: { $ref: '#/components/schemas/Review' }
 *                 updatedEstablishment: { $ref: '#/components/schemas/PublicEstablishment' }
 *       400:
 *         description: Invalid reviewId or input
 *       403:
 *         description: Forbidden (not your review)
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 updatedEstablishment: { $ref: '#/components/schemas/PublicEstablishment' }
 *       400:
 *         description: Invalid reviewId
 *       403:
 *         description: Forbidden (not your review)
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:reviewId', userAuth, reviewsController.updateReview as any);
router.delete('/:reviewId', userAuth, reviewsController.deleteReview as any);

export default router;
