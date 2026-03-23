import { Router } from 'express';
import { establishmentAuth } from '../../shared/middleware/auth.middleware';
import * as boxesController from './boxes.controller';

const router = Router();

/**
 * @swagger
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
 *               description: { type: string }
 *               recommendedPrice: { type: number }
 *               quantityOfItems: { type: number }
 *               typeIds: { type: array, items: { type: string, format: uuid } }
 *               productIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       201: { description: Created }
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
 *       200: { description: Success }
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
 *               description: { type: string }
 *               recommendedPrice: { type: number }
 *               quantityOfItems: { type: number }
 *               typeIds: { type: array, items: { type: string, format: uuid } }
 *               productIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Updated }
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
 *       200: { description: Deleted }
 */
router.patch('/:id', establishmentAuth, boxesController.updateBox);
router.delete('/:id', establishmentAuth, boxesController.deleteBox);

export default router;
