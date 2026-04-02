export interface SummaryResult {
    totalIncome: number
    totalExpenses: number
    netBalance: number
    transactionCount: number
}

export interface CategoryTotal {
    category: string
    type: 'INCOME' | 'EXPENSE'
    total: number
    count: number
}

export interface TrendEntry {
    label: string
    income: number
    expenses: number
    net: number
}

export interface RecentTransaction {
    id: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    category: string
    date: Date
    notes: string | null
    user: {
        id: string
        name: string
        email: string
    }
}