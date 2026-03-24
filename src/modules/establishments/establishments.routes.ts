import { Router } from 'express';
import {
  updateEstablishmentProfile,
  getEstablishment,
  getEstablishments,
} from './establishments.controller';
import { establishmentAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateEstablishmentInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         description:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *         latitude:
 *           type: string
 *         longitude:
 *           type: string
 *         workingHours:
 *           type: string
 *           nullable: true
 *         boundTo:
 *           type: string
 *           nullable: true
 *     Establishment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *         latitude:
 *           type: string
 *         longitude:
 *           type: string
 *         workingHours:
 *           type: string
 *           nullable: true
 *         rating:
 *           type: string
 *           nullable: true
 *         boundTo:
 *           type: string
 *           nullable: true
 *         isEmailVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           example: "Active"
 */

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
 */
router.get('/', getEstablishments);

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
 *               $ref: '#/components/schemas/Establishment'
 *       404:
 *         description: Establishment not found
 */
router.get('/:establishmentId', getEstablishment);

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
 *                   $ref: '#/components/schemas/Establishment'
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
