import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many requests, please try again later.' },
    },
})

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many auth attempts, please try again later.' },
    },
})