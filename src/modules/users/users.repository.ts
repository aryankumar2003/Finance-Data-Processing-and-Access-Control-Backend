import { prisma } from '../../lib/prisma'
import type { CreateUserInput, UpdateUserInput, UserFilterInput } from './users.schema'
import bcrypt from 'bcryptjs'

export class UserRepository {
    private readonly safeSelect = {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
    }

    async findMany(filters: UserFilterInput, skip: number, take: number) {
        const where = {
            ...(filters.role !== undefined && { role: filters.role }),
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        }

        const [data, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: this.safeSelect,
            }),
            prisma.user.count({ where }),
        ])

        return { data, total }
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: this.safeSelect,
        })
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        })
    }

    async create(input: CreateUserInput) {
        const passwordHash = await bcrypt.hash(input.password, 12)

        return prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                passwordHash,
                role: input.role,
            },
            select: this.safeSelect,
        })
    }

    async update(id: string, input: UpdateUserInput) {
        return prisma.user.update({
            where: { id },
            data: input,
            select: this.safeSelect,
        })
    }

    async deactivate(id: string) {
        return prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: this.safeSelect,
        })
    }
}

export const userRepository = new UserRepository()