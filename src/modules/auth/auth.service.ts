import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { env } from '../../config/env'
import type { RegisterInput, LoginInput } from './auth.schema'
import type { JwtPayload } from '../../types'

export class AuthService {
    async register(input: RegisterInput) {
        const existing = await prisma.user.findUnique({
            where: { email: input.email },
        })

        if (existing) {
            throw new AppError('Email already in use', 409)
        }

        const passwordHash = await bcrypt.hash(input.password, 12)

        const user = await prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                passwordHash,
                role: input.role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        })

        const token = this.signToken({ userId: user.id, role: user.role })

        return { user, token }
    }

    async login(input: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: input.email },
        })

        if (!user) {
            throw new AppError('Invalid email or password', 401)
        }

        if (!user.isActive) {
            throw new AppError('Account is deactivated. Contact an admin.', 403)
        }

        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash)

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401)
        }

        const token = this.signToken({ userId: user.id, role: user.role })

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
        }
    }

    private signToken(payload: JwtPayload): string {
        return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' })
    }
}

export const authService = new AuthService()