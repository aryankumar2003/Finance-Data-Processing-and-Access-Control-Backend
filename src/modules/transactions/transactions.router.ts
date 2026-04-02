import { Router } from 'express'
import { transactionService } from './transactions.service'
import { authenticate } from '../../middleware/authenticate'
import { authorizeRole } from '../../middleware/authorizeRole'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import { apiResponse } from '../../utils/apiResponse'
import {
    createTransactionSchema,
    updateTransactionSchema,
    transactionFilterSchema,
    transactionParamsSchema,
} from './transactions.schema'

import type {
    CreateTransactionInput,
    UpdateTransactionInput,
    TransactionFilterInput,
} from './transactions.schema'

const router = Router()

router.use(authenticate)

router.get(
    '/',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    validate({ query: transactionFilterSchema }),
    asyncHandler(async (req, res) => {
        const result = await transactionService.getAll(
            req.query as unknown as TransactionFilterInput,
            req.user!.userId,
            req.user!.role
        )
        res.json(apiResponse.success(result))
    })
)

router.get(
    '/:id',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    validate({ params: transactionParamsSchema }),
    asyncHandler(async (req, res) => {
        const transaction = await transactionService.getById(
            req.params.id as string,
            req.user!.userId,
            req.user!.role
        )
        res.json(apiResponse.success(transaction))
    })
)

router.post(
    '/',
    authorizeRole(['ADMIN']),
    validate({ body: createTransactionSchema }),
    asyncHandler(async (req, res) => {
        const transaction = await transactionService.create(
            req.body as CreateTransactionInput,
            req.user!.userId
        )
        res.status(201).json(apiResponse.success(transaction, 'Transaction created successfully'))
    })
)

router.patch(
    '/:id',
    authorizeRole(['ADMIN']),
    validate({ body: updateTransactionSchema, params: transactionParamsSchema }),
    asyncHandler(async (req, res) => {
        const transaction = await transactionService.update(
            req.params.id as string,
            req.body as UpdateTransactionInput,
            req.user!.userId,
            req.user!.role
        )
        res.json(apiResponse.success(transaction, 'Transaction updated successfully'))
    })
)

router.delete(
    '/:id',
    authorizeRole(['ADMIN']),
    validate({ params: transactionParamsSchema }),
    asyncHandler(async (req, res) => {
        await transactionService.delete(req.params.id as string)
        res.json(apiResponse.success(null, 'Transaction deleted successfully'))
    })
)

export default router