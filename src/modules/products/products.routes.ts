import { Router } from 'express';
import { establishmentAuth } from '../../shared/middleware/auth.middleware';
import * as productController from './products.controller';

const router = Router();

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product template
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               picture: { type: string }
 *               weight: { type: number }
 *               description: { type: string }
 *               recommendedPrice: { type: number }
 *               typeIds: { type: array, items: { type: string, format: uuid } }
 *               allergenIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       201: { description: Created }
 *   get:
 *     summary: Get product templates
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Private, All] }
 *     responses:
 *       200: { description: Success }
 */
router.post('/', establishmentAuth, productController.createProduct);
router.get('/', establishmentAuth, productController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product template
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               picture: { type: string }
 *               weight: { type: number }
 *               description: { type: string }
 *               recommendedPrice: { type: number }
 *               typeIds: { type: array, items: { type: string, format: uuid } }
 *               allergenIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete a product template
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 */
router.patch('/:id', establishmentAuth, productController.updateProduct);
router.delete('/:id', establishmentAuth, productController.deleteProduct);

export default router;
