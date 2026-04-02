import { Router, Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import { validate } from '../../middleware/validate'
import { authLimiter } from '../../utils/rateLimiter'
import { registerSchema, loginSchema } from './auth.schema'
import { apiResponse } from '../../utils/apiResponse'
import { asyncHandler } from '../../utils/asyncHandler'

const router = Router()

router.post(
    '/register',
    authLimiter,
    validate({ body: registerSchema }),
    asyncHandler(async (req, res) => {
        const result = await authService.register(req.body)
        res.status(201).json(apiResponse.success(result, 'User registered successfully'))
    })
)

router.post(
    '/login',
    authLimiter,
    validate({ body: loginSchema }),
    asyncHandler(async (req, res) => {
        const result = await authService.login(req.body)
        res.status(200).json(apiResponse.success(result, 'Login successful'))
    })
)

export default router