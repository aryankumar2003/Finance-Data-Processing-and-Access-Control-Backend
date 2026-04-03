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

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List all users
 *     description: Returns paginated list of all users. Admin only.
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
 *           example: true
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
 *                         data:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Creates a user directly without going through registration. Admin only.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *           example:
 *             name: Jane Smith
 *             email: jane@example.com
 *             password: Password1
 *             role: ANALYST
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
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
 *
 * /api/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get own profile
 *     description: Returns the currently authenticated user's profile. All roles.
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Returns a single user by their ID. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's cuid
 *         example: clx1234abcd
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update a user
 *     description: Update name, email, role or active status. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: clx1234abcd
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *           example:
 *             role: ANALYST
 *             isActive: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or cannot deactivate own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
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
 *   delete:
 *     tags:
 *       - Users
 *     summary: Deactivate a user
 *     description: Soft deactivates the user — sets isActive to false. Admin only. Cannot deactivate own account.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: clx1234abcd
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Cannot deactivate own account or already inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

const router = Router()
router.use(authenticate)

router.get(
    '/',
    authorizeRole(['ADMIN']),
    validate({ query: userFilterSchema }),
    asyncHandler(async (req, res) => {
        const result = await userService.getAll(req.query as unknown as UserFilterInput)
        res.json(apiResponse.success(result))
    })
)

router.get(
    '/me',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    asyncHandler(async (req, res) => {
        const user = await userService.getById(req.user!.userId)
        res.json(apiResponse.success(user))
    })
)

router.get(
    '/:id',
    authorizeRole(['ADMIN']),
    validate({ params: userParamsSchema }),
    asyncHandler(async (req, res) => {
        const user = await userService.getById(req.params.id as string)
        res.json(apiResponse.success(user))
    })
)

router.post(
    '/',
    authorizeRole(['ADMIN']),
    validate({ body: createUserSchema }),
    asyncHandler(async (req, res) => {
        const user = await userService.create(req.body as CreateUserInput)
        res.status(201).json(apiResponse.success(user, 'User created successfully'))
    })
)

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