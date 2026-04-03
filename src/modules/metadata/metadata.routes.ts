import { Router } from 'express';
import * as metadataController from './metadata.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductType:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *     Allergen:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *
 * /metadata/product-types:
 *   get:
 *     summary: Get all product types
 *     tags: [Metadata]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: List of product types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productTypes:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductType' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       500:
 *         description: Internal server error
 */
router.get('/product-types', metadataController.getProductTypes);

/**
 * @swagger
 * /metadata/allergens:
 *   get:
 *     summary: Get all types of allergens
 *     tags: [Metadata]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: List of allergens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allergens:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Allergen' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       500:
 *         description: Internal server error
 */
router.get('/allergens', metadataController.getAllergens);

export default router;
