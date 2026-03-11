import { Router } from 'express';
import { getUser } from './users.controller';

const router = Router();

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieves a single user from the mock database by their unique ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the user
 *         example: "1"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User 1 was gotten successfully"
 *                 user:
 *                   $ref: '#/components/schemas/MockUser'
 *       400:
 *         description: Bad request - User ID is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MockUser:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - role
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the user
 *           example: "1"
 *         name:
 *           type: string
 *           description: Full name of the user
 *           example: "Alice Johnson"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user
 *           example: "alice@example.com"
 *         role:
 *           type: string
 *           enum: [admin, user, moderator]
 *           description: Role of the user in the system
 *           example: "admin"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was created
 *           example: "2024-01-15T10:00:00Z"
 */

router.get('/:userId', getUser);

export default router;
