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
router.get(
    '/me',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    asyncHandler(async (req, res) => {
        const user = await userService.getById(req.user!.userId)
        res.json(apiResponse.success(user))
    })
)

// GET /api/users/:id — admin only
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