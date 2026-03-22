import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { testConnection } from './services/db'
import { initPayments } from './services/payments'
import { errorHandler } from './middleware/errorHandler'
import { validateEnv } from './types'
import { authRouter }               from './routes/auth'
import { reviewRouter, repoRouter } from './routes/review'
import { paymentRouter }            from './routes/payment'
import { webhookRouter }            from './routes/webhook'

dotenv.config()
validateEnv()

const app  = express()
const PORT = parseInt(process.env.PORT ?? '4000')

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin:         process.env.CLIENT_URL ?? 'http://localhost:3000',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// JSON parser FIRST — before routes and rate limiter
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// Webhooks use their own raw() parser internally — mount after json parser
app.use('/api/webhook', webhookRouter)

// Rate limiter — after webhooks so GitHub/LS never get 429
const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests, slow down.' },
})
app.use('/api', apiLimiter)

app.use('/api/auth',     authRouter)
app.use('/api/reviews',  reviewRouter)
app.use('/api/repos',    repoRouter)
app.use('/api/payments', paymentRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }))
app.use(errorHandler)

async function bootstrap() {
  await testConnection()
  initPayments()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

bootstrap().catch(err => { console.error('Startup failed:', err); process.exit(1) })

export default app