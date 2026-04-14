import { Router } from 'express';
import * as metadataController from './metadata.controller';

const router = Router();

router.get('/product-types', metadataController.getProductTypes);
router.get('/allergens', metadataController.getAllergens);

export default router;

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
 */

/**
 * @swagger
 * /metadata/product-types:
 *   get:
 *     summary: Get all product types (Paginated)
 *     tags: [Metadata]
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

/**
 * @swagger
 * /metadata/allergens:
 *   get:
 *     summary: Get all types of allergens (Paginated)
 *     tags: [Metadata]
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
