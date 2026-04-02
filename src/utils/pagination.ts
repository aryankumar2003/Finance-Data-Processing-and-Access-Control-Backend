import { PaginationMeta } from '../types'

interface PaginationInput {
    page?: number
    limit?: number
}

interface PaginationResult {
    skip: number
    take: number
    meta: (total: number) => PaginationMeta
}

export const paginate = (input: PaginationInput): PaginationResult => {
    const page = Math.max(1, input.page ?? 1)
    const limit = Math.min(100, Math.max(1, input.limit ?? 20))
    const skip = (page - 1) * limit

    return {
        skip,
        take: limit,
        meta: (total: number): PaginationMeta => ({
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }),
    }
}