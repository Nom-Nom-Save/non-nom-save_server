import { Router } from 'express';
import { establishmentAuth } from '../../shared/middleware/auth.middleware';
import { addToMenu, getMenu, changeStatus, getPublicMenu } from './menu.controller';

const router = Router();

/**
 * @swagger
 * /menu/public/{establishmentId}:
 *   get:
 *     summary: Get all active menu items for a specific establishment (Public)
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: establishmentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Success }
 */
router.get('/public/:establishmentId', getPublicMenu);

/**
 * @swagger
 * /menu:
 *   post:
 *     summary: Add a template (Product/Box) to the establishment menu
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, itemType, totalQuantity, originalPrice]
 *             properties:
 *               itemId: { type: string, format: uuid }
 *               itemType: { type: string, enum: [Product, Box] }
 *               totalQuantity: { type: number }
 *               originalPrice: { type: number }
 *               discountPrice: { type: number }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *     responses:
 *       201: { description: Created }
 *   get:
 *     summary: Get establishment menu
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Success }
 */
router.post('/', establishmentAuth, addToMenu);
router.get('/', establishmentAuth, getMenu);

/**
 * @swagger
 * /menu/{id}/status:
 *   patch:
 *     summary: Change menu item status
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/:id/status', establishmentAuth, changeStatus);

export default router;
