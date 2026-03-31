import { Router } from 'express';
import { establishmentAuth } from '../../shared/middleware/auth.middleware';
import * as boxesController from './boxes.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Box:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *         picture: { type: string, nullable: true }
 *         description: { type: string, nullable: true }
 *         recommendedPrice: { type: number, nullable: true }
 *         minWeight: { type: number, nullable: true }
 *         maxWeight: { type: number, nullable: true }
 *         quantityOfItems: { type: number }
 *         boundTo: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         types: { type: array, items: { type: string } }
 *         products: { type: array, items: { type: string } }
 *
 * /boxes:
 *   post:
 *     summary: Create a box template
 *     tags: [Boxes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, quantityOfItems]
 *             properties:
 *               name: { type: string }
 *               picture: { type: string }
 *               boundTo: { type: string }
 *               description: { type: string }
 *               recommendedPrice: { type: number }
 *               quantityOfItems: { type: number }
 *               typeIds: { type: array, items: { type: string, format: uuid } }
 *               productIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: Box created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 box: { $ref: '#/components/schemas/Box' }
 *       400:
 *         description: Bad request (e.g. missing name or quantity)
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get box templates
 *     tags: [Boxes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Private, All] }
 *     responses:
 *       200:
 *         description: List of boxes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 boxes:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Box' }
 *       500:
 *         description: Internal server error
 */
router.post('/', establishmentAuth, boxesController.createBox);
router.get('/', establishmentAuth, boxesController.getBoxes);

/**
 * @swagger
 * /boxes/{id}:
 *   patch:
 *     summary: Update a box template
 *     tags: [Boxes]
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
 *               boundTo: { type: string }
 *               description: { type: string }
 *               recommendedPrice: { type: number }
 *               quantityOfItems: { type: number }
 *               typeIds: { type: array, items: { type: string, format: uuid } }
 *               productIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Box updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 box: { $ref: '#/components/schemas/Box' }
 *       403:
 *         description: Forbidden (trying to edit someone else's box)
 *       404:
 *         description: Box not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a box template
 *     tags: [Boxes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Box deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       403:
 *         description: Forbidden (trying to delete someone else's box)
 *       404:
 *         description: Box not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', establishmentAuth, boxesController.updateBox);
router.delete('/:id', establishmentAuth, boxesController.deleteBox);

export default router;
