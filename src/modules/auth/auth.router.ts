import { Router, Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import { validate } from '../../middleware/validate'
import { authLimiter } from '../../utils/rateLimiter'
import { registerSchema, loginSchema } from './auth.schema'
import { apiResponse } from '../../utils/apiResponse'

const router = Router()

router.post(
    '/register',
    authLimiter,
    validate({ body: registerSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await authService.register(req.body)
            res.status(201).json(apiResponse.success(result, 'User registered successfully'))
        } catch (err) {
            next(err)
        }
    }
)

router.post(
    '/login',
    authLimiter,
    validate({ body: loginSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await authService.login(req.body)
            res.status(200).json(apiResponse.success(result, 'Login successful'))
        } catch (err) {
            next(err)
        }
    }
)

export default router