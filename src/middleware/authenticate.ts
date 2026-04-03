import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AppError } from '../utils/AppError'
import type { JwtPayload } from '../types'

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError('Missing or invalid authorization header', 401))
    }

    const token = authHeader.split(' ')[1]

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
        req.user = payload
        next()
    } catch {
        next(new AppError('Invalid or expired token', 401))
    }
}