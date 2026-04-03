import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { globalLimiter } from './utils/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import authRouter from './modules/auth/auth.router'
import transactionRouter from './modules/transactions/transactions.router'
import userRouter from './modules/users/users.router'
import dashboardRouter from './modules/dashboard/dashboard.router'
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(globalLimiter)


app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionRouter)
app.use('/api/users', userRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Zorvyn Finance API',
    swaggerOptions: {
        persistAuthorization: true,
    },
}))
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

export default app
