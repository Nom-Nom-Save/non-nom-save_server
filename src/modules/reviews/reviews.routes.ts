import { Router } from 'express';
import * as reviewsController from './reviews.controller';
import { userAuth, optionalAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         editableUntil:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             fullName:
 *               type: string
 *               nullable: true
 *
 *     MyReview:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         editableUntil:
 *           type: string
 *           format: date-time
 *         isEditable:
 *           type: boolean
 *
 *     RatingDistributionItem:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         count:
 *           type: integer
 *         percentage:
 *           type: number
 *           format: float
 *           example: 33.33
 *
 *     CreateReviewInput:
 *       type: object
 *       required:
 *         - establishmentId
 *         - rating
 *       properties:
 *         establishmentId:
 *           type: string
 *           format: uuid
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           nullable: true
 *
 *     UpdateReviewInput:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           nullable: true
 *
 *     PublicEstablishment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         latitude:
 *           type: string
 *           nullable: true
 *         longitude:
 *           type: string
 *           nullable: true
 *         workingHours:
 *           type: string
 *           nullable: true
 *         logo:
 *           type: string
 *           nullable: true
 *         banner:
 *           type: string
 *           nullable: true
 *         rating:
 *           type: string
 *           nullable: true
 *           example: "4.50"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review for an establishment
 *     description: Authenticated users can leave one review per establishment per day.
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
 *                 message:
 *                   type: string
 *                   example: Review created successfully
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *                 updatedEstablishment:
 *                   $ref: '#/components/schemas/PublicEstablishment'
 *       400:
 *         description: Bad request — already reviewed this establishment today
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You can only review the same establishment once a day
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/', userAuth, reviewsController.createReview as any);

/**
 * @swagger
 * /reviews/establishment/{establishmentId}:
 *   get:
 *     summary: Get reviews for a specific establishment
 *     description: >
 *       Returns paginated reviews for the given establishment along with
 *       overall rating, rating distribution, and (if authenticated as a regular user)
 *       the current user's own review.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: establishmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the establishment
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number (requires limit)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Items per page (requires page)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order by creation date
 *       - in: query
 *         name: ratingFilter
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5]
 *         description: Filter reviews by exact star rating
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 myReview:
 *                   nullable: true
 *                   allOf:
 *                     - $ref: '#/components/schemas/MyReview'
 *                   description: Current user's review for this establishment (only for authenticated users with role "user")
 *                 rating:
 *                   type: string
 *                   example: "4.50"
 *                   description: Overall average rating of the establishment
 *                 ratingDistribution:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RatingDistributionItem'
 *                 meta:
 *                   description: Present only when page & limit query params are provided
 *                   allOf:
 *                     - $ref: '#/components/schemas/PaginationMeta'
 *       500:
 *         description: Internal server error
 */
router.get(
  '/establishment/:establishmentId',
  optionalAuth,
  reviewsController.getEstablishmentReviews as any
);

/**
 * @swagger
 * /reviews/establishment/{establishmentId}/my:
 *   get:
 *     summary: Get current user's reviews for a specific establishment
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: establishmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the establishment
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order by creation date
 *       - in: query
 *         name: ratingFilter
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5]
 *         description: Filter reviews by exact star rating
 *     responses:
 *       200:
 *         description: User's reviews for the establishment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MyReview'
 *       400:
 *         description: Invalid establishmentId
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get(
  '/establishment/:establishmentId/my',
  userAuth,
  reviewsController.getUserReviewsForEstablishment as any
);

/**
 * @swagger
 * /reviews/my:
 *   get:
 *     summary: Get all reviews left by the current user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number (requires limit)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Items per page (requires page)
 *     responses:
 *       200:
 *         description: User's reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     allOf:
 *                       - $ref: '#/components/schemas/MyReview'
 *                     properties:
 *                       establishment:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                 meta:
 *                   description: Present only when page & limit query params are provided
 *                   allOf:
 *                     - $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/my', userAuth, reviewsController.getMyReviews as any);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   patch:
 *     summary: Update an existing review
 *     description: A review can only be edited within 24 hours of its creation by its author.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the review to update
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
 *                 message:
 *                   type: string
 *                   example: Review updated successfully
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *                 updatedEstablishment:
 *                   $ref: '#/components/schemas/PublicEstablishment'
 *       400:
 *         description: Invalid reviewId or edit window has expired (>24 hours)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reviews can only be edited within 24 hours of creation
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — you can only update your own reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You can only update your own reviews
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete a review
 *     description: Only the author of the review can delete it.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the review to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Review deleted successfully
 *                 updatedEstablishment:
 *                   $ref: '#/components/schemas/PublicEstablishment'
 *       400:
 *         description: Invalid reviewId
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — you can only delete your own reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You can only delete your own reviews
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:reviewId', userAuth, reviewsController.updateReview as any);
router.delete('/:reviewId', userAuth, reviewsController.deleteReview as any);

export default router;
