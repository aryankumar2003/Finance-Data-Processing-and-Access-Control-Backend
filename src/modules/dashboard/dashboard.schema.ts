import { z } from 'zod'

export const trendQuerySchema = z.object({
    period: z.enum(['monthly', 'weekly']).default('monthly'),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
})

export const recentQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(50).default(10),
})

export type TrendQueryInput = z.infer<typeof trendQuerySchema>
export type RecentQueryInput = z.infer<typeof recentQuerySchema>