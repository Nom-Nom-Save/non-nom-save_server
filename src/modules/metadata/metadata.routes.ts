import { Router } from 'express';
import * as metadataController from './metadata.controller';

const router = Router();

/**
 * @swagger
 * /metadata/product-types:
 *   get:
 *     summary: Get all product types
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/product-types', metadataController.getProductTypes);

/**
 * @swagger
 * /metadata/allergens:
 *   get:
 *     summary: Get all types of allergens
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/allergens', metadataController.getAllergens);

export default router;
