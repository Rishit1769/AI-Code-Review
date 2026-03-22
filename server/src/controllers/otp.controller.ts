import { Response } from 'express'
import crypto from 'crypto'
import { AuthRequest, User, PLAN_LIMITS } from '../types'
import { query, queryOne, execute } from '../services/db'
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/mailer'
import { signToken } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export const sendOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, name } = req.body

  const [{ count }] = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM otp_codes
     WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
    [email]
  )
  if (count >= 3) {
    res.status(429).json({ success: false, error: 'Too many attempts. Wait 15 minutes.' })
    return
  }

  const existing = await queryOne<{ id: string; verified: boolean }>(
    'SELECT id, verified FROM users WHERE email = ?', [email]
  )
  if (!existing) {
    await execute('INSERT INTO users (email, name, verified) VALUES (?, ?, FALSE)', [email, name || ''])
  }

  await execute('UPDATE otp_codes SET used = TRUE WHERE email = ? AND used = FALSE', [email])

  const otp = generateOTP()

  // Use MySQL NOW() + INTERVAL to avoid UTC/IST timezone mismatch
  await execute(
    'INSERT INTO otp_codes (email, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
    [email, hashOTP(otp)]
  )

  await sendOTPEmail(email, otp, name)

  res.json({
    success: true,
    message: `Verification code sent to ${email}`,
    ...(process.env.NODE_ENV === 'development' && { dev_otp: otp }),
  })
})

export const verifyOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, otp } = req.body

  const record = await queryOne<{ id: string }>(
    `SELECT id FROM otp_codes
     WHERE email = ? AND code_hash = ? AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, hashOTP(otp)]
  )
  if (!record) {
    res.status(400).json({ success: false, error: 'Invalid or expired OTP. Request a new one.' })
    return
  }

  await execute('UPDATE otp_codes SET used = TRUE WHERE id = ?', [record.id])

  const user = await queryOne<User>('SELECT * FROM users WHERE email = ?', [email])
  if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return }

  const isNewUser = !user.verified
  await execute(
    'UPDATE users SET verified = TRUE, reviews_limit = ? WHERE email = ?',
    [PLAN_LIMITS[user.plan] ?? 10, email]
  )

  if (isNewUser) sendWelcomeEmail(email, user.name).catch(console.error)

  const token = signToken(user.id)
  const { github_token, ...safeUser } = user as any

  res.json({ success: true, token, user: safeUser, isNewUser })
})

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' })
    return
  }

  const user = await queryOne<User>(
    `SELECT id, email, name, verified, plan, reviews_used, reviews_limit,
            ls_subscription_id, github_username, created_at
     FROM users WHERE id = ?`,
    [req.userId]
  )
  if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return }
  res.json({ success: true, data: user })
})
