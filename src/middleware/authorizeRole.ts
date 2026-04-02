import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

type Role = 'VIEWER' | 'ANALYST' | 'ADMIN'

export const authorizeRole = (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user

        if (!user) {
            return next(new AppError('Unauthenticated', 401))
        }

        if (!allowedRoles.includes(user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            )
        }

        next()
    }
}