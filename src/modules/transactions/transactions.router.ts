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
/**
 * @openapi
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated transactions
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Transaction'
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags: [Transactions]
 *     summary: Create a transaction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 example: salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-01"
 *               notes:
 *                 type: string
 *                 example: March salary
 *     responses:
 *       201:
 *         description: Transaction created
 *       403:
 *         description: Admin only
 *
 * /api/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction found
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Transactions]
 *     summary: Update a transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags: [Transactions]
 *     summary: Soft delete a transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       404:
 *         description: Not found
 */
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