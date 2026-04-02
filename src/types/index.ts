export type Role = 'VIEWER' | 'ANALYST' | 'ADMIN'
export type TransactionType = 'INCOME' | 'EXPENSE'

export interface JwtPayload {
    userId: string
    role: Role
}

export interface PaginationMeta {
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface PaginatedResponse<T> {
    data: T[]
    meta: PaginationMeta
}

export interface ApiSuccess<T = unknown> {
    success: true
    data: T
}

export interface ApiError {
    success: false
    error: {
        message: string
        details?: { field: string; message: string }[]
    }
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export interface TransactionFilters {
    type?: TransactionType
    category?: string
    from?: Date
    to?: Date
    userId?: string
    includeDeleted?: boolean
}

export interface DashboardSummary {
    totalIncome: number
    totalExpenses: number
    netBalance: number
    transactionCount: number
}

export interface CategoryTotal {
    category: string
    type: TransactionType
    total: number
    count: number
}

export interface TrendEntry {
    label: string
    income: number
    expenses: number
    net: number
}