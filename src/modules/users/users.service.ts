import { AppError } from '../../utils/AppError'
import { paginate } from '../../utils/pagination'
import { userRepository } from './users.repository'
import type { CreateUserInput, UpdateUserInput, UserFilterInput } from './users.schema'

export class UserService {
    async getAll(filters: UserFilterInput) {
        const { skip, take, meta } = paginate({
            page: filters.page,
            limit: filters.limit,
        })

        const { data, total } = await userRepository.findMany(filters, skip, take)

        return { data, meta: meta(total) }
    }

    async getById(id: string) {
        const user = await userRepository.findById(id)

        if (!user) {
            throw new AppError('User not found', 404)
        }

        return user
    }

    async create(input: CreateUserInput) {
        const existing = await userRepository.findByEmail(input.email)

        if (existing) {
            throw new AppError('Email already in use', 409)
        }

        return userRepository.create(input)
    }

    async update(id: string, input: UpdateUserInput, requesterId: string) {
        const user = await userRepository.findById(id)

        if (!user) {
            throw new AppError('User not found', 404)
        }

        // Check email uniqueness if email is being changed
        if (input.email && input.email !== user.email) {
            const existing = await userRepository.findByEmail(input.email)
            if (existing) {
                throw new AppError('Email already in use', 409)
            }
        }

        // Prevent admin from deactivating themselves
        if (input.isActive === false && id === requesterId) {
            throw new AppError('You cannot deactivate your own account', 400)
        }

        return userRepository.update(id, input)
    }

    async deactivate(id: string, requesterId: string) {
        const user = await userRepository.findById(id)

        if (!user) {
            throw new AppError('User not found', 404)
        }

        if (id === requesterId) {
            throw new AppError('You cannot deactivate your own account', 400)
        }

        if (!user.isActive) {
            throw new AppError('User is already deactivated', 400)
        }

        return userRepository.deactivate(id)
    }
}

export const userService = new UserService()