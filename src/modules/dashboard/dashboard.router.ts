import { Router } from 'express'
import { dashboardService } from './dashboard.service'
import { authenticate } from '../../middleware/authenticate'
import { authorizeRole } from '../../middleware/authorizeRole'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import { apiResponse } from '../../utils/apiResponse'
import type { TrendQueryInput, RecentQueryInput } from './dashboard.schema'
import { trendQuerySchema, recentQuerySchema } from './dashboard.schema'

const router = Router()

router.use(authenticate)
/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get total income, expenses and net balance
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
 *     tags: [Dashboard]
 *     summary: Get category-wise totals
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
 *
 * /api/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly or weekly trends
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
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Trend data
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
 *
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent transactions
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
 *         description: Recent transactions
 */
// GET /api/dashboard/summary — all roles
router.get(
    '/summary',
    authorizeRole(['VIEWER', 'ANALYST', 'ADMIN']),
    asyncHandler(async (_req, res) => {
        const result = await dashboardService.getSummary()
        res.json(apiResponse.success(result))
    })
)

// GET /api/dashboard/by-category — analyst + admin
router.get(
    '/by-category',
    authorizeRole(['ANALYST', 'ADMIN']),
    asyncHandler(async (_req, res) => {
        const result = await dashboardService.getByCategory()
        res.json(apiResponse.success(result))
    })
)

// GET /api/dashboard/trends — analyst + admin
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

// GET /api/dashboard/recent — all roles
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