import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { globalLimiter } from './utils/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import authRouter from './modules/auth/auth.router'
import transactionRouter from './modules/transactions/transactions.router'


const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(globalLimiter)

app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionRouter)


app.use(errorHandler)

export default app