import { Router } from 'express';
import { establishmentAuth } from '../../shared/middleware/auth.middleware';
import {
  addToMenu,
  getMenu,
  changeStatus,
  getPublicMenu,
  getMenuItem,
  updateMenu,
} from './menu.controller';

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
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menu:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       establishmentId: { type: string, format: uuid }
 *                       itemId: { type: string, format: uuid }
 *                       itemType: { type: string, enum: [Product, Box] }
 *                       status: { type: string, enum: [Active, Inactive, SoldOut] }
 *                       priceData:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           menuItemId: { type: string, format: uuid }
 *                           totalQuantity: { type: number }
 *                           availableQuantity: { type: number }
 *                           originalPrice: { type: number }
 *                           discountPrice: { type: number }
 *                           startTime: { type: string, format: date-time }
 *                           endTime: { type: string, format: date-time }
 *                           createdAt: { type: string, format: date-time }
 *                       itemDetails:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           name: { type: string, nullable: true }
 *                           description: { type: string, nullable: true }
 *                           weightInfo: { type: string, nullable: true }
 *                           types: { type: array, items: { type: string } }
 *                           allergens: { type: array, items: { type: string } }
 */
router.get('/public/:establishmentId', getPublicMenu);

/**
 * @swagger
 * /menu/item/{menuId}:
 *   get:
 *     summary: Get single menu item details
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menuItem:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     establishmentId: { type: string, format: uuid }
 *                     itemId: { type: string, format: uuid }
 *                     itemType: { type: string, enum: [Product, Box] }
 *                     status: { type: string, enum: [Active, Inactive, SoldOut] }
 *                     priceData:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         menuItemId: { type: string, format: uuid }
 *                         totalQuantity: { type: number }
 *                         availableQuantity: { type: number }
 *                         originalPrice: { type: number }
 *                         discountPrice: { type: number }
 *                         startTime: { type: string, format: date-time }
 *                         endTime: { type: string, format: date-time }
 *                         createdAt: { type: string, format: date-time }
 *                     itemDetails:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         name: { type: string, nullable: true }
 *                         description: { type: string, nullable: true }
 *                         weightInfo: { type: string, nullable: true }
 *                         types: { type: array, items: { type: string } }
 *                         allergens: { type: array, items: { type: string } }
 *       404:
 *         description: Menu item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */
router.get('/item/:menuId', getMenuItem);

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
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 menuEntry:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     establishmentId: { type: string, format: uuid }
 *                     itemId: { type: string, format: uuid }
 *                     itemType: { type: string, enum: [Product, Box] }
 *                     status: { type: string, enum: [Active, Inactive, SoldOut] }
 *                     priceData:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         menuItemId: { type: string, format: uuid }
 *                         totalQuantity: { type: number }
 *                         availableQuantity: { type: number }
 *                         originalPrice: { type: number }
 *                         discountPrice: { type: number }
 *                         startTime: { type: string, format: date-time }
 *                         endTime: { type: string, format: date-time }
 */
router.post('/', establishmentAuth, addToMenu);

/**
 * @swagger
 * /menu:
 *   get:
 *     summary: Get establishment menu
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menu:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       establishmentId: { type: string, format: uuid }
 *                       itemId: { type: string, format: uuid }
 *                       itemType: { type: string, enum: [Product, Box] }
 *                       status: { type: string, enum: [Active, Inactive, SoldOut] }
 *                       priceData:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           menuItemId: { type: string, format: uuid }
 *                           totalQuantity: { type: number }
 *                           availableQuantity: { type: number }
 *                           originalPrice: { type: number }
 *                           discountPrice: { type: number }
 *                           startTime: { type: string, format: date-time }
 *                           endTime: { type: string, format: date-time }
 *                           createdAt: { type: string, format: date-time }
 *                       itemDetails:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           name: { type: string, nullable: true }
 *                           description: { type: string, nullable: true }
 *                           weightInfo: { type: string, nullable: true }
 *                           types: { type: array, items: { type: string } }
 *                           allergens: { type: array, items: { type: string } }
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
 *               status: { type: string, enum: [Active, Inactive, SoldOut] }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */
router.patch('/:id/status', establishmentAuth, changeStatus);

/**
 * @swagger
 * /menu/{id}:
 *   patch:
 *     summary: Update menu item (only if status is not Active)
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
 *             properties:
 *               totalQuantity: { type: number }
 *               originalPrice: { type: number }
 *               discountPrice: { type: number }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */
router.patch('/:id', establishmentAuth, updateMenu);

export default router;
