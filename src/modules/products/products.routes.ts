import { Router } from 'express';
import { establishmentAuth } from '../../shared/middleware/auth.middleware';
import * as productController from './products.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *         picture: { type: string, nullable: true }
 *         boundTo: { type: string }
 *         weight: { type: number, nullable: true }
 *         description: { type: string, nullable: true }
 *         recommendedPrice: { type: number, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         types: { type: array, items: { type: string } }
 *         allergens: { type: array, items: { type: string } }
 *
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
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 product: { $ref: '#/components/schemas/Product' }
 *       400:
 *         description: Bad request (e.g. missing name)
 *       500:
 *         description: Internal server error
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
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *       500:
 *         description: Internal server error
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
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 product: { $ref: '#/components/schemas/Product' }
 *       403:
 *         description: Forbidden (trying to edit someone else's product)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
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
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       403:
 *         description: Forbidden (trying to delete someone else's product)
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', establishmentAuth, productController.updateProduct);
router.delete('/:id', establishmentAuth, productController.deleteProduct);

export default router;
