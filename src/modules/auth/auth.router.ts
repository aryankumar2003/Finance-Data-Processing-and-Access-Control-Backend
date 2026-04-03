import { Router } from 'express'
import { authService } from './auth.service'
import { validate } from '../../middleware/validate'
import { authLimiter } from '../../utils/rateLimiter'
import { registerSchema, loginSchema } from './auth.schema'
import { apiResponse } from '../../utils/apiResponse'
import { asyncHandler } from '../../utils/asyncHandler'

const router = Router()

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login and receive JWT token
 *     description: Use the default admin credentials below to get a bearer token. Copy the token from the response and click the Authorize button at the top.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           example:
 *             email: admin@zorvyn.com
 *             password: Admin1234
 *     responses:
 *       200:
 *         description: Login successful — copy the token from data.token and click Authorize
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/login',
    authLimiter,
    validate({ body: loginSchema }),
    asyncHandler(async (req, res) => {
        const result = await authService.login(req.body)
        res.status(200).json(apiResponse.success(result, 'Login successful'))
    })
)

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *           example:
 *             name: John Doe
 *             email: john@example.com
 *             password: Password1
 *             role: VIEWER
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
    '/register',
    authLimiter,
    validate({ body: registerSchema }),
    asyncHandler(async (req, res) => {
        const result = await authService.register(req.body)
        res.status(201).json(apiResponse.success(result, 'User registered successfully'))
    })
)

export default router