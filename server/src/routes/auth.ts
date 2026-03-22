import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { sendOTP, verifyOTP, getMe } from '../controllers/otp.controller'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { SendOTPSchema, VerifyOTPSchema } from '../schemas'

export const authRouter = Router()

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { success: false, error: 'Too many requests. Try again in 1 hour.' },
})

authRouter.post('/send-otp',   otpLimiter, validate(SendOTPSchema),   sendOTP)
authRouter.post('/verify-otp', otpLimiter, validate(VerifyOTPSchema), verifyOTP)
authRouter.get('/me', requireAuth, getMe)