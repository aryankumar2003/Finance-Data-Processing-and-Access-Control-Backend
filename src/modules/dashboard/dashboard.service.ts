import { prisma } from '../../lib/prisma'
import type { TrendQueryInput, RecentQueryInput } from './dashboard.schema'
import type {
    SummaryResult,
    CategoryTotal,
    TrendEntry,
    RecentTransaction,
} from './dashboard.types'

export class DashboardService {
    async getSummary(): Promise<SummaryResult> {
        const [incomeResult, expenseResult, transactionCount] = await prisma.$transaction([
            prisma.transaction.aggregate({
                where: { type: 'INCOME', isDeleted: false },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: { type: 'EXPENSE', isDeleted: false },
                _sum: { amount: true },
            }),
            prisma.transaction.count({
                where: { isDeleted: false },
            }),
        ])

        const totalIncome = Number(incomeResult._sum.amount ?? 0)
        const totalExpenses = Number(expenseResult._sum.amount ?? 0)

        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            transactionCount,
        }
    }

    async getByCategory(): Promise<CategoryTotal[]> {
        const results = await prisma.transaction.groupBy({
            by: ['category', 'type'],
            where: { isDeleted: false },
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: 'desc' } },
        })

        return results.map((r) => ({
            category: r.category,
            type: r.type as 'INCOME' | 'EXPENSE',
            total: Number(r._sum.amount ?? 0),
            count: r._count.id,
        }))
    }

    async getTrends(query: TrendQueryInput): Promise<TrendEntry[]> {
        const where = {
            isDeleted: false,
            ...(query.from || query.to
                ? {
                    date: {
                        ...(query.from && { gte: query.from }),
                        ...(query.to && { lte: query.to }),
                    },
                }
                : {}),
        }

        const transactions = await prisma.transaction.findMany({
            where,
            select: { amount: true, type: true, date: true },
            orderBy: { date: 'asc' },
        })

        // Group in memory by period label
        const grouped = new Map<string, { income: number; expenses: number }>()

        for (const tx of transactions) {
            const label =
                query.period === 'monthly'
                    ? tx.date.toISOString().slice(0, 7)   // "2024-01"
                    : getWeekLabel(tx.date)                // "2024-W03"

            if (!grouped.has(label)) {
                grouped.set(label, { income: 0, expenses: 0 })
            }

            const entry = grouped.get(label)!
            const amount = Number(tx.amount)

            if (tx.type === 'INCOME') {
                entry.income += amount
            } else {
                entry.expenses += amount
            }
        }

        return Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, { income, expenses }]) => ({
                label,
                income: Math.round(income * 100) / 100,
                expenses: Math.round(expenses * 100) / 100,
                net: Math.round((income - expenses) * 100) / 100,
            }))
    }

    async getRecent(query: RecentQueryInput): Promise<RecentTransaction[]> {
        const transactions = await prisma.transaction.findMany({
            where: { isDeleted: false },
            take: query.limit,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                amount: true,
                type: true,
                category: true,
                date: true,
                notes: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        })

        return transactions.map((tx) => ({
            ...tx,
            amount: Number(tx.amount),
            type: tx.type as 'INCOME' | 'EXPENSE',
        }))
    }
}

export const dashboardService = new DashboardService()

// Helper — ISO week label e.g. "2024-W03"
function getWeekLabel(date: Date): string {
    const d = new Date(date)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}