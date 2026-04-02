import { z } from 'zod'

export const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).default('VIEWER'),
})

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
})

export const userParamsSchema = z.object({
    id: z.string().min(1, 'User ID is required'),
})

export const userFilterSchema = z.object({
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserFilterInput = z.infer<typeof userFilterSchema>