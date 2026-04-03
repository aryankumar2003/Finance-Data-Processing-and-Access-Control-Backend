import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Make sure your .env file is present.')
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    }),
})

// Seed passwords — override via env vars in CI / staging environments
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!'
const ANALYST_PASSWORD = process.env.SEED_ANALYST_PASSWORD ?? 'Analyst1234!'
const VIEWER_PASSWORD = process.env.SEED_VIEWER_PASSWORD ?? 'Viewer1234!'

async function main() {
    const [adminHash, analystHash, viewerHash] = await Promise.all([
        bcrypt.hash(ADMIN_PASSWORD, 12),
        bcrypt.hash(ANALYST_PASSWORD, 12),
        bcrypt.hash(VIEWER_PASSWORD, 12),
    ])

    const admin = await prisma.user.upsert({
        where: { email: 'admin@zorvyn.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@zorvyn.com',
            passwordHash: adminHash,
            role: 'ADMIN',
            isActive: true,
        },
    })

    await prisma.user.upsert({
        where: { email: 'analyst@zorvyn.com' },
        update: {},
        create: {
            name: 'Finance Analyst',
            email: 'analyst@zorvyn.com',
            passwordHash: analystHash,
            role: 'ANALYST',
            isActive: true,
        },
    })

    await prisma.user.upsert({
        where: { email: 'viewer@zorvyn.com' },
        update: {},
        create: {
            name: 'Dashboard Viewer',
            email: 'viewer@zorvyn.com',
            passwordHash: viewerHash,
            role: 'VIEWER',
            isActive: true,
        },
    })

    // Clear existing seed transactions before re-seeding to avoid duplicates
    await prisma.transaction.deleteMany({ where: { userId: admin.id } })

    const categories = ['salary', 'rent', 'groceries', 'utilities', 'freelance', 'entertainment']
    const types = ['INCOME', 'EXPENSE'] as const

    for (let i = 0; i < 20; i++) {
        await prisma.transaction.create({
            data: {
                amount: Number((Math.random() * 5000 + 100).toFixed(2)),
                type: types[i % 2],
                category: categories[i % categories.length],
                date: new Date(2024, i % 12, (i % 28) + 1),
                notes: `Sample transaction ${i + 1}`,
                userId: admin.id,
            },
        })
    }

    console.log('Yes Seed complete')
    console.log(`   admin@zorvyn.com    — password: ${ADMIN_PASSWORD}`)
    console.log(`   analyst@zorvyn.com  — password: ${ANALYST_PASSWORD}`)
    console.log(`   viewer@zorvyn.com   — password: ${VIEWER_PASSWORD}`)
}

main()
    .catch((e) => {
        console.error('No Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })