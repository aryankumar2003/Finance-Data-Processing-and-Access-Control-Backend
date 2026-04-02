import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                ...(err.details && { details: err.details }),
            },
        })
    }

    // Unexpected error — don't leak internals
    console.error('[Unhandled Error]', err)
    return res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    })
}