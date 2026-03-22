import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { CreateCheckoutSchema } from '../schemas'
import { createCheckoutSession, cancelSubscription, getBillingPortal } from '../controllers/payment.controller'

export const paymentRouter = Router()

paymentRouter.post('/checkout', requireAuth, validate(CreateCheckoutSchema), createCheckoutSession)
paymentRouter.post('/cancel',   requireAuth, cancelSubscription)
paymentRouter.get('/portal',    requireAuth, getBillingPortal)