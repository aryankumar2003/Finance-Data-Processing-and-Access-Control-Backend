import { z } from 'zod'

export const createTransactionSchema = z.object({
    amount: z
        .number({ error: 'Amount must be a number' })
        .positive('Amount must be greater than 0')
        .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().min(1, 'Category is required').max(50),
    date: z.coerce.date({ error: 'Invalid date format' }),
    notes: z.string().max(500).optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const transactionFilterSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    includeDeleted: z.coerce.boolean().default(false),
})

export const transactionParamsSchema = z.object({
    id: z.string().min(1, 'Transaction ID is required'),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>