import { Router } from 'express';
import { userAuth, auth, establishmentAuth } from '../../shared/middleware/auth.middleware';
import * as ordersController from './orders.controller';

const router = Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [menuPriceId, quantity]
 *                   properties:
 *                     menuPriceId: { type: string, format: uuid }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       201: { description: Order created successfully }
 *       400: { description: Bad request }
 *       403: { description: Only users can create orders }
 *   get:
 *     summary: Get orders for the authenticated user or establishment
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Success }
 *       401: { description: Unauthorized }
 */
router.post('/', userAuth, ordersController.createOrder);
router.get('/', auth, ordersController.getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Success }
 *       403: { description: Forbidden }
 *       404: { description: Order not found }
 */
router.get('/:id', auth, ordersController.getOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (Establishment only)
 *     tags: [Orders]
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
 *               status: { type: string, enum: [Reserved, Completed, Cancelled, Expired] }
 *     responses:
 *       200: { description: Order status updated }
 *       400: { description: Bad request }
 *       403: { description: "Forbidden: Access only for establishments" }
 */
router.patch('/:id/status', establishmentAuth, ordersController.updateStatus);

export default router;
