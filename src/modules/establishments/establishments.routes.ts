import { Router } from 'express';
import {
  updateEstablishmentProfile,
  getEstablishment,
  getEstablishments,
  getNearbyEstablishments,
  getEstablishmentPrivate,
  getAvailableCities,
  getEstablishmentsByIds,
} from './establishments.controller';
import { establishmentAuth, optionalAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/profile', establishmentAuth, getEstablishmentPrivate);
router.get('/', getEstablishments);
router.get('/nearby', getNearbyEstablishments);
router.get('/cities', getAvailableCities);
router.get('/by-ids', getEstablishmentsByIds);
router.get('/:establishmentId', optionalAuth, getEstablishment);
router.patch('/:establishmentId', establishmentAuth, updateEstablishmentProfile);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Establishment:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *         description: { type: string, nullable: true }
 *         address: { type: string }
 *         latitude: { type: string }
 *         longitude: { type: string }
 *         workingHours: { type: string, nullable: true }
 *         logo: { type: string, nullable: true }
 *         banner: { type: string, nullable: true }
 *         rating: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *     SubscriptionInfo:
 *       type: object
 *       properties:
 *         status: { type: string, example: "active" }
 *         planName: { type: string, example: "Premium Plan" }
 *         endDate: { type: string, format: date-time }
 *     EstablishmentDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/Establishment'
 *         - type: object
 *           properties:
 *             reviewCount: { type: integer }
 *             isFavorite: { type: boolean }
 *             bagsSold: { type: integer }
 *             foodSaved: { type: string }
 *             subscription:
 *               $ref: '#/components/schemas/SubscriptionInfo'
 *               nullable: true
 *     UpdateEstablishmentInput:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         email: { type: string, format: email }
 *         description: { type: string, nullable: true }
 *         address: { type: string }
 *         workingHours: { type: string, nullable: true }
 *         logo: { type: string, nullable: true }
 *         banner: { type: string, nullable: true }
 *         boundTo: { type: string, nullable: true }
 */

/**
 * @swagger
 * /establishments/profile:
 *   get:
 *     summary: Get the authenticated establishment's full profile
 *     description: Requires establishment authentication.
 *     tags: [Establishments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 establishment:
 *                   $ref: '#/components/schemas/EstablishmentDetail'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Establishment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /establishments:
 *   get:
 *     summary: Get all establishments with filters and sorting (Paginated)
 *     tags: [Establishments]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name to filter establishments by address
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         description: Latitude for distance filtering
 *       - in: query
 *         name: lon
 *         schema: { type: number }
 *         description: Longitude for distance filtering
 *       - in: query
 *         name: radius
 *         schema: { type: number }
 *         description: Radius in kilometers for distance filtering
 *       - in: query
 *         name: minRating
 *         schema: { type: number }
 *         description: Minimum rating filter
 *       - in: query
 *         name: productTypeIds
 *         schema: { type: string }
 *         description: Comma-separated product type IDs
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [rating, distance, closingTime], default: distance }
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *         description: Sort order
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
 *         description: List of establishments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 establishments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Establishment'
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */

/**
 * @swagger
 * /establishments/nearby:
 *   get:
 *     summary: Get establishments within a radius of coordinates (Paginated)
 *     tags: [Establishments]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lon
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: radius
 *         required: true
 *         schema: { type: number }
 *         description: Radius in kilometers
 *       - in: query
 *         name: minRating
 *         schema: { type: number }
 *       - in: query
 *         name: productTypeIds
 *         schema: { type: string }
 *         description: Comma-separated product type IDs
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [rating, distance, closingTime], default: distance }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: asc }
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
 *         description: List of nearby establishments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 establishments:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Establishment' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */

/**
 * @swagger
 * /establishments/cities:
 *   get:
 *     summary: Get list of available cities
 *     description: Returns a sorted list of unique cities where verified establishments are located.
 *     tags: [Establishments]
 *     responses:
 *       200:
 *         description: Available cities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Available cities retrieved successfully
 *                 cities:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Kyiv", "Lviv", "Odesa"]
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /establishments/{establishmentId}:
 *   get:
 *     summary: Get establishment profile
 *     tags: [Establishments]
 *     parameters:
 *       - in: path
 *         name: establishmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
     responses:
 *       200:
 *         description: Establishment profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 establishment: { $ref: '#/components/schemas/EstablishmentDetail' }
 *       404:
 *         description: Establishment not found
 */

/**
 * @swagger
 * /establishments/{establishmentId}:
 *   patch:
 *     summary: Update establishment profile
 *     description: Requires establishment authentication. Can only update own profile.
 *     tags: [Establishments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: establishmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEstablishmentInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 establishment:
 *                   $ref: '#/components/schemas/EstablishmentDetail'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your profile or not an establishment
 *       404:
 *         description: Establishment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /establishments/by-ids:
 *   get:
 *     summary: Get multiple establishments by their IDs
 *     description: Returns a list of establishments matching the provided IDs. Used for cart page to fetch only relevant establishments.
 *     tags: [Establishments]
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of establishment UUIDs
 *         example: "uuid1,uuid2,uuid3"
 *     responses:
 *       200:
 *         description: Establishments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 establishments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Establishment'
 *       400:
 *         description: ids query parameter is required
 *       500:
 *         description: Internal server error
 */
