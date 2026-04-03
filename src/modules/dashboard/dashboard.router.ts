import { Router } from 'express'
import { dashboardService } from './dashboard.service'
import { authenticate } from '../../middleware/authenticate'
import { authorizeRole } from '../../middleware/authorizeRole'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import { apiResponse } from '../../utils/apiResponse'
import type { TrendQueryInput, RecentQueryInput } from './dashboard.schema'
import { trendQuerySchema, recentQuerySchema } from './dashboard.schema'

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Total income, expenses and net balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardSummary'
 *
 * /api/dashboard/by-category:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Category-wise income and expense totals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CategoryTotal'
 *       403:
 *         description: Analyst and Admin only
 *
 * /api/dashboard/trends:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Monthly or weekly income and expense trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, weekly]
 *           default: monthly
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Trend data grouped by period
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TrendEntry'
 *       403:
 *         description: Analyst and Admin only
 *
 * /api/dashboard/recent:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Most recent transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Recent transactions list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 */

const router = Router()
router.use(authenticate)

router.get(
    '/summary',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    asyncHandler(async (_req, res) => {
        const result = await dashboardService.getSummary()
        res.json(apiResponse.success(result))
    })
)

router.get(
    '/by-category',
    authorizeRole(['ANALYST', 'ADMIN']),
    asyncHandler(async (_req, res) => {
        const result = await dashboardService.getByCategory()
        res.json(apiResponse.success(result))
    })
)

router.get(
    '/trends',
    authorizeRole(['ANALYST', 'ADMIN']),
    validate({ query: trendQuerySchema }),
    asyncHandler(async (req, res) => {
        const result = await dashboardService.getTrends(
            req.query as unknown as TrendQueryInput
        )
        res.json(apiResponse.success(result))
    })
)

router.get(
    '/recent',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    validate({ query: recentQuerySchema }),
    asyncHandler(async (req, res) => {
        const result = await dashboardService.getRecent(
            req.query as unknown as RecentQueryInput
        )
        res.json(apiResponse.success(result))
    })
)

export default router