import { Response } from 'express'
import { AuthRequest, User } from '../types'
import { queryOne, execute } from '../services/db'
import { createCheckoutUrl, cancelUserSubscription } from '../services/payments'
import { asyncHandler, AppError } from '../middleware/errorHandler'

export const createCheckoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { plan } = req.body
  const user = await queryOne<User>('SELECT id, email, name, plan FROM users WHERE id = ?', [req.userId!])
  if (!user) throw new AppError(404, 'User not found')
  if (user.plan === plan) { res.status(400).json({ success: false, error: `Already on ${plan} plan` }); return }

  const url = await createCheckoutUrl(plan, user.email, user.id, user.name)
  res.json({ success: true, data: { url } })
})

export const cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await queryOne<User>('SELECT id, plan, ls_subscription_id FROM users WHERE id = ?', [req.userId!])
  if (!user) throw new AppError(404, 'User not found')
  if (user.plan === 'free' || !user.ls_subscription_id) {
    res.status(400).json({ success: false, error: 'No active subscription' }); return
  }
  await cancelUserSubscription(user.ls_subscription_id)
  await execute('UPDATE users SET plan = ?, reviews_limit = 10, ls_subscription_id = NULL WHERE id = ?', ['free', user.id])
  res.json({ success: true, message: 'Subscription cancelled. Moved to free plan.' })
})

export const getBillingPortal = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { url: 'https://app.lemonsqueezy.com/my-orders' } })
})