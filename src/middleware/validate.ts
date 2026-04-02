import { Request, Response, NextFunction } from 'express'
import { ZodObject, ZodRawShape, ZodError } from 'zod'
import { AppError } from '../utils/AppError'

interface Schemas {
    body?: ZodObject<ZodRawShape>
    query?: ZodObject<ZodRawShape>
    params?: ZodObject<ZodRawShape>
}

export const validate = (schemas: Schemas) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) req.body = schemas.body.parse(req.body)
            if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query
            if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params
            next()
        } catch (err) {
            if (err instanceof ZodError) {
                const messages = (err.issues ?? []).map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }))
                return next(new AppError('Validation failed', 400, messages))
            }
            next(err)
        }
    }
}