import { AppError } from '../../utils/AppError'
import { paginate } from '../../utils/pagination'
import { transactionRepository } from './transactions.repository'
import type {
    CreateTransactionInput,
    UpdateTransactionInput,
    TransactionFilterInput,
} from './transactions.schema'
import type { TransactionFilters } from '../../types'

export class TransactionService {
    async getAll(filters: TransactionFilterInput, userId: string, role: string) {
        const { skip, take, meta } = paginate({
            page: filters.page,
            limit: filters.limit,
        })

        // Viewers and Analysts can only see their own transactions
        const resolvedFilters: TransactionFilters = {
            ...filters,
            userId: role === 'ADMIN' ? undefined : userId,
            includeDeleted: role === 'ADMIN' ? filters.includeDeleted : false,
        }

        const { data, total } = await transactionRepository.findMany(
            resolvedFilters,
            skip,
            take
        )

        return { data, meta: meta(total) }
    }

    async getById(id: string, userId: string, role: string) {
        const transaction = await transactionRepository.findById(id)

        if (!transaction) {
            throw new AppError('Transaction not found', 404)
        }

        // Non-admins can only view their own transactions
        if (role !== 'ADMIN' && transaction.userId !== userId) {
            throw new AppError('Transaction not found', 404)
        }

        return transaction
    }

    async create(data: CreateTransactionInput, userId: string) {
        return transactionRepository.create(data, userId)
    }

    async update(id: string, data: UpdateTransactionInput, userId: string, role: string) {
        const transaction = await transactionRepository.findById(id)

        if (!transaction) {
            throw new AppError('Transaction not found', 404)
        }

        if (role !== 'ADMIN' && transaction.userId !== userId) {
            throw new AppError('Transaction not found', 404)
        }

        return transactionRepository.update(id, data)
    }

    async delete(id: string) {
        const transaction = await transactionRepository.findById(id)

        if (!transaction) {
            throw new AppError('Transaction not found', 404)
        }

        return transactionRepository.softDelete(id)
    }
}

export const transactionService = new TransactionService()