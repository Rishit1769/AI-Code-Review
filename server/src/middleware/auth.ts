import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { queryOne } from '../services/db'

// Fix 2: Use plain Request so Express router overloads stay happy
// Controllers cast to AuthRequest internally where needed
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' })
      return
    }

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user    = await queryOne<{ id: string; plan: string; verified: boolean }>(
      'SELECT id, plan, verified FROM users WHERE id = ?',
      [decoded.userId]
    )

    if (!user) { res.status(401).json({ success: false, error: 'User not found' }); return }
    if (!user.verified) { res.status(403).json({ success: false, error: 'Email not verified' }); return }

    // Attach to request object — cast through any to avoid TS conflicts
    (req as any).userId   = user.id;
    (req as any).userPlan = user.plan
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired — please log in again' })
    } else {
      res.status(401).json({ success: false, error: 'Invalid token' })
    }
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}