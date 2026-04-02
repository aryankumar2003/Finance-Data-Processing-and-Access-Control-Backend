import { prisma } from '../../lib/prisma'
import { TransactionFilters } from '../../types'
import { CreateTransactionInput, UpdateTransactionInput } from './transactions.schema'

export class TransactionRepository {
    private buildWhereClause(filters: TransactionFilters) {
        return {
            ...(filters.type && { type: filters.type }),
            ...(filters.category && { category: { contains: filters.category, mode: 'insensitive' as const } }),
            ...(filters.userId && { userId: filters.userId }),
            ...((filters.from || filters.to) && {
                date: {
                    ...(filters.from && { gte: filters.from }),
                    ...(filters.to && { lte: filters.to }),
                },
            }),
            isDeleted: filters.includeDeleted ? undefined : false,
        }
    }

    async findMany(filters: TransactionFilters, skip: number, take: number) {
        const where = this.buildWhereClause(filters)

        const [data, total] = await prisma.$transaction([
            prisma.transaction.findMany({
                where,
                skip,
                take,
                orderBy: { date: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            prisma.transaction.count({ where }),
        ])

        return { data, total }
    }

    async findById(id: string) {
        return prisma.transaction.findFirst({
            where: { id, isDeleted: false },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        })
    }

    async create(data: CreateTransactionInput, userId: string) {
        return prisma.transaction.create({
            data: {
                ...data,
                userId,
            },
        })
    }

    async update(id: string, data: UpdateTransactionInput) {
        return prisma.transaction.update({
            where: { id },
            data,
        })
    }

    async softDelete(id: string) {
        return prisma.transaction.update({
            where: { id },
            data: { isDeleted: true },
        })
    }
}

export const transactionRepository = new TransactionRepository()