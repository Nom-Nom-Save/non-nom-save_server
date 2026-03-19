import { Router } from 'express';
import {
  forgotPassword,
  login,
  refreshToken,
  registerEstablishment,
  registerUser,
  resetPassword,
  verifyEmail,
  verifyResetCode,
} from './auth.controller';

const router = Router();

router.post('/register-user', registerUser);
router.post('/register-establishment', registerEstablishment);
router.post('/verify-email', verifyEmail);
router.post('/refresh', refreshToken);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;

/**
 * @swagger
 * /auth/register-user:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends a 4-digit verification code to the provided email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration successful. Please check your email for verification code."
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Missing required fields"
 *       409:
 *         description: Conflict — user or establishment with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               userExists:
 *                 value:
 *                   message: "User already exists"
 *               establishmentExists:
 *                 value:
 *                   message: "Establishment with such email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/register-establishment:
 *   post:
 *     summary: Register a new establishment
 *     description: Creates a new establishment account. Address is geocoded via OpenStreetMap. Sends a 4-digit verification code to the provided email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterEstablishmentRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration successful. Please check your email for verification code."
 *                 email:
 *                   type: string
 *                   example: "cafe@example.com"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Missing required fields"
 *       409:
 *         description: Conflict — establishment or user with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               establishmentExists:
 *                 value:
 *                   message: "Establishment already exists"
 *               userExists:
 *                 value:
 *                   message: "User with such email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Verifies a user's or establishment's email using the 4-digit code sent during registration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *       400:
 *         description: Bad request — missing fields, invalid format, expired or wrong code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 value:
 *                   message: "Email and verification code are required"
 *               invalidFormat:
 *                 value:
 *                   message: "Verification code must be 4 digits"
 *               digitsOnly:
 *                 value:
 *                   message: "Verification code must contain only digits"
 *               invalidCode:
 *                 value:
 *                   message: "Invalid or expired verification code"
 *               alreadyVerified:
 *                 value:
 *                   message: "Email already verified"
 *       404:
 *         description: User or establishment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User or establishment not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: Authenticates a user or establishment. Returns an access token in the response body and sets a refreshToken httpOnly cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refreshToken cookie (7 days)
 *             schema:
 *               type: string
 *               example: "refreshToken=eyJ...; HttpOnly; SameSite=Strict"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 value:
 *                   message: "Email, password and login type are required"
 *               invalidEmail:
 *                 value:
 *                   message: "Invalid email format"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               wrongCredentialsUser:
 *                 value:
 *                   message: "No matches for users, please check your email or login"
 *               wrongCredentialsEstablishment:
 *                 value:
 *                   message: "No matches for establishment, please check your email or login"
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Please verify your email"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Issues a new access token and rotates the refresh token using the httpOnly cookie.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: Rotated httpOnly refreshToken cookie (7 days)
 *             schema:
 *               type: string
 *               example: "refreshToken=eyJ...; HttpOnly; SameSite=Strict"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 value:
 *                   message: "Missing refresh token"
 *               invalid:
 *                 value:
 *                   message: "Invalid or expired refresh token"
 *       404:
 *         description: User or establishment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User or establishment not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a 4-digit password reset code to the provided email address. Works for both users and establishments.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset code sent. Please check your email."
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *       400:
 *         description: Missing or invalid email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 value:
 *                   message: "Email is required"
 *               invalidFormat:
 *                 value:
 *                   message: "Invalid email format"
 *               invalidDataType:
 *                 value:
 *                   message: "Invalid data format"
 *       404:
 *         description: No user or establishment found for this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "No user or establishment found for this email"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verify password reset code
 *     description: Validates the 4-digit reset code sent to the user's email. The code is consumed after successful verification — a new code must be requested if needed again.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyResetCodeRequest'
 *     responses:
 *       200:
 *         description: Code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Code verified. You can now reset your password."
 *       400:
 *         description: Missing fields, invalid format, or wrong/expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 value:
 *                   message: "Email and code are required"
 *               invalidEmail:
 *                 value:
 *                   message: "Invalid email format"
 *               invalidCode:
 *                 value:
 *                   message: "Code must contain only digits"
 *               expiredCode:
 *                 value:
 *                   message: "Invalid or expired code"
 *               invalidDataType:
 *                 value:
 *                   message: "Invalid data format"
 *       404:
 *         description: No user or establishment found for this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "No user or establishment found for this email"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Sets a new password for the user or establishment. Must be called after successfully verifying the reset code via /auth/verify-code.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password successfully reset. You can now log in."
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 value:
 *                   message: "Email and new password are required"
 *               invalidEmail:
 *                 value:
 *                   message: "Invalid email format"
 *       404:
 *         description: No user or establishment found for this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "No user or establishment found for this email"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: refreshToken
 *   schemas:
 *     RegisterUserRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "StrongPass123!"
 *
 *     RegisterEstablishmentRequest:
 *       type: object
 *       required:
 *         - establishmentName
 *         - email
 *         - password
 *         - address
 *       properties:
 *         establishmentName:
 *           type: string
 *           example: "Cozy Cafe"
 *         email:
 *           type: string
 *           format: email
 *           example: "cafe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "StrongPass123!"
 *         address:
 *           type: string
 *           example: "123 Main St, Kyiv, Ukraine"
 *
 *     VerifyEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - code
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         code:
 *           type: string
 *           minLength: 4
 *           maxLength: 4
 *           pattern: '^\d{4}$'
 *           example: "4821"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - loginType
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "StrongPass123!"
 *         loginType:
 *           type: string
 *           enum: [user, establishment]
 *           example: "user"
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *
 *     VerifyResetCodeRequest:
 *       type: object
 *       required:
 *         - email
 *         - code
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         code:
 *           type: string
 *           minLength: 4
 *           maxLength: 4
 *           pattern: '^\d{4}$'
 *           example: "3957"
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *         - newPassword
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         newPassword:
 *           type: string
 *           format: password
 *           example: "NewStrongPass456!"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Internal server error"
 */
