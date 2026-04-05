import { Router } from 'express';
import {
  updateEstablishmentProfile,
  getEstablishment,
  getEstablishments,
  getNearbyEstablishments,
  getEstablishmentPrivate,
} from './establishments.controller';
import { establishmentAuth, optionalAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

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
 *     EstablishmentDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/Establishment'
 *         - type: object
 *           properties:
 *             reviewCount: { type: integer }
 *             isFavorite: { type: boolean }
 *             bagsSold: { type: integer }
 *             foodSaved: { type: string }
 *     UpdateEstablishmentInput:
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
router.get('/profile', establishmentAuth, getEstablishmentPrivate);

/**
 * @swagger
 * /establishments:
 *   get:
 *     summary: Get all establishments or filter by city
 *     tags: [Establishments]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name to filter establishments by address
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
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
router.get('/', getEstablishments);

/**
 * @swagger
 * /establishments/nearby:
 *   get:
 *     summary: Get establishments within a radius of coordinates
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
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
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
router.get('/nearby', getNearbyEstablishments);

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
 *     responses:
 *       200:
 *         description: Establishment profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 establishment: { $ref: '#/components/schemas/Establishment' }
 *       404:
 *         description: Establishment not found
 */
router.get('/:establishmentId', optionalAuth, getEstablishment);

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
router.patch('/:establishmentId', establishmentAuth, updateEstablishmentProfile);

export default router;
