import { Router } from 'express';
import { userAuth, auth, establishmentAuth } from '../../shared/middleware/auth.middleware';
import * as ordersController from './orders.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderDetail:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         orderId: { type: string, format: uuid }
 *         menuPriceId: { type: string, format: uuid }
 *         quantity: { type: integer }
 *         price: { type: number }
 *         originalPrice: { type: number }
 *         discountPrice: { type: number, nullable: true }
 *         itemName: { type: string }
 *         itemType: { type: string }
 *         weight: { type: number, nullable: true }
 *         minWeight: { type: number, nullable: true }
 *         maxWeight: { type: number, nullable: true }
 *     Order:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         totalPrice: { type: number }
 *         orderStatus: { type: string, enum: [Reserved, Completed, Cancelled, Expired] }
 *         qrCodeData: { type: string }
 *         reservedAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time, nullable: true }
 *         completedAt: { type: string, format: date-time, nullable: true }
 *     OrderWithDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Order'
 *         - type: object
 *           properties:
 *             details:
 *               type: array
 *               items: { $ref: '#/components/schemas/OrderDetail' }
 *             establishmentName: { type: string }
 *             establishmentAddress: { type: string, nullable: true }
 *             establishmentLogo: { type: string, nullable: true }
 *             establishmentBanner: { type: string, nullable: true }
 *             allergens: { type: array, items: { type: string } }
 *             totalOrderWeight: { type: number }
 *
 */

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
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       400:
 *         description: Bad request (e.g. not enough quantity, items from different establishments)
 *       403:
 *         description: Only users can create orders
 *   get:
 *     summary: Get orders for the authenticated user or establishment
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/OrderWithDetails' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order: { $ref: '#/components/schemas/OrderWithDetails' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (trying to access someone else's order)
 *       404:
 *         description: Order not found
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
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (Access only for establishments or wrong establishment)
 */
router.patch('/:id/status', establishmentAuth, ordersController.updateStatus);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order (User only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       400:
 *         description: Bad request (e.g. order already completed or not found)
 *       403:
 *         description: Only users can cancel their orders
 */
router.patch('/:id/cancel', userAuth, ordersController.cancelOrder);

export default router;
