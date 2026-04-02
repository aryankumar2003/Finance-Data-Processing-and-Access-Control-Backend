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