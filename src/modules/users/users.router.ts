import { Router } from 'express'
import { userService } from './users.service'
import { authenticate } from '../../middleware/authenticate'
import { authorizeRole } from '../../middleware/authorizeRole'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import { apiResponse } from '../../utils/apiResponse'
import type { CreateUserInput, UpdateUserInput, UserFilterInput } from './users.schema'
import {
    createUserSchema,
    updateUserSchema,
    userParamsSchema,
    userFilterSchema,
} from './users.schema'

const router = Router()

router.use(authenticate)

// GET /api/users — admin only
/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [VIEWER, ANALYST, ADMIN]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Forbidden — admin only
 */
router.get(
    '/',
    authorizeRole(['ADMIN']),
    validate({ query: userFilterSchema }),
    asyncHandler(async (req, res) => {
        const result = await userService.getAll(
            req.query as unknown as UserFilterInput
        )
        res.json(apiResponse.success(result))
    })
)

// GET /api/users/me — all roles (get own profile)
/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get own profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthenticated
 */
router.get(
    '/me',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    asyncHandler(async (req, res) => {
        const user = await userService.getById(req.user!.userId)
        res.json(apiResponse.success(user))
    })
)

// GET /api/users/:id — admin only
/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *   patch:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 *       400:
 *         description: Cannot deactivate own account
 */
router.get(
    '/:id',
    authorizeRole(['ADMIN']),
    validate({ params: userParamsSchema }),
    asyncHandler(async (req, res) => {
        const user = await userService.getById(req.params.id as string)
        res.json(apiResponse.success(user))
    })
)

// POST /api/users — admin only
/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already in use
 */
router.post(
    '/',
    authorizeRole(['ADMIN']),
    validate({ body: createUserSchema }),
    asyncHandler(async (req, res) => {
        const user = await userService.create(req.body as CreateUserInput)
        res.status(201).json(apiResponse.success(user, 'User created successfully'))
    })
)

// PATCH /api/users/:id — admin only
router.patch(
    '/:id',
    authorizeRole(['ADMIN']),
    validate({ body: updateUserSchema, params: userParamsSchema }),
    asyncHandler(async (req, res) => {
        const user = await userService.update(
            req.params.id as string,
            req.body as UpdateUserInput,
            req.user!.userId
        )
        res.json(apiResponse.success(user, 'User updated successfully'))
    })
)

// DELETE /api/users/:id — admin only (soft deactivate)
router.delete(
    '/:id',
    authorizeRole(['ADMIN']),
    validate({ params: userParamsSchema }),
    asyncHandler(async (req, res) => {
        const user = await userService.deactivate(
            req.params.id as string,
            req.user!.userId
        )
        res.json(apiResponse.success(user, 'User deactivated successfully'))
    })
)

export default router