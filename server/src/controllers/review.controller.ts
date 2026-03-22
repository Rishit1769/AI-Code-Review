import { Response } from 'express'
import { AuthRequest, Review, Repo } from '../types'
import { query, queryOne, execute } from '../services/db'
import { asyncHandler } from '../middleware/errorHandler'

// Fix 9: clamp page/limit to safe bounds
function safePagination(pageStr: unknown, limitStr: unknown) {
  const page  = Math.max(1, parseInt(pageStr as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(limitStr as string) || 20)) // max 100 per page
  return { page, limit, offset: (page - 1) * limit }
}

export const listReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, offset } = safePagination(req.query.page, req.query.limit)

  const reviews = await query<Review & { repo_full_name: string }>(
    `SELECT r.*, rp.full_name as repo_full_name
     FROM reviews r
     JOIN repos rp ON r.repo_id = rp.id
     WHERE rp.user_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [req.userId!, String(limit), String(offset)]
  )

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM reviews r
     JOIN repos rp ON r.repo_id = rp.id WHERE rp.user_id = ?`,
    [req.userId!]
  )

  res.json({ success: true, data: reviews, meta: { page, limit, total, pages: Math.ceil(total / limit) } })
})

export const getReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await queryOne<Review & { repo_full_name: string }>(
    `SELECT r.*, rp.full_name as repo_full_name
     FROM reviews r JOIN repos rp ON r.repo_id = rp.id
     WHERE r.id = ? AND rp.user_id = ?`,
    [String(req.params.id), req.userId!]
  )
  if (!review) { res.status(404).json({ success: false, error: 'Review not found' }); return }
  res.json({ success: true, data: review })
})

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [user] = await query<{ reviews_used: number; reviews_limit: number; plan: string }>(
    'SELECT reviews_used, reviews_limit, plan FROM users WHERE id = ?', [req.userId!]
  )
  const [{ total_reviews }] = await query<{ total_reviews: number }>(
    `SELECT COUNT(*) as total_reviews FROM reviews r
     JOIN repos rp ON r.repo_id = rp.id WHERE rp.user_id = ?`, [req.userId!]
  )
  const [{ repos_count }] = await query<{ repos_count: number }>(
    'SELECT COUNT(*) as repos_count FROM repos WHERE user_id = ? AND active = TRUE', [req.userId!]
  )
  const [{ monthly }] = await query<{ monthly: number }>(
    `SELECT COUNT(*) as monthly FROM reviews r
     JOIN repos rp ON r.repo_id = rp.id
     WHERE rp.user_id = ? AND r.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`, [req.userId!]
  )
  res.json({
    success: true,
    data: {
      plan:            user?.plan ?? 'free',
      reviews_used:    user?.reviews_used ?? 0,
      reviews_limit:   user?.reviews_limit ?? 10,
      total_reviews,
      repos_count,
      monthly_reviews: monthly,
    },
  })
})

export const listRepos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repos = await query<Repo>(
    'SELECT * FROM repos WHERE user_id = ? ORDER BY created_at DESC', [req.userId!]
  )
  res.json({ success: true, data: repos })
})

export const addRepo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { github_id, name, full_name, private: isPrivate } = req.body
  const existing = await queryOne('SELECT id FROM repos WHERE user_id = ? AND github_id = ?', [req.userId!, github_id])
  if (existing) { res.status(409).json({ success: false, error: 'Repo already connected' }); return }
  await execute(
    'INSERT INTO repos (user_id, github_id, name, full_name, private) VALUES (?, ?, ?, ?, ?)',
    [req.userId!, github_id, name, full_name, isPrivate ?? false]
  )
  res.status(201).json({ success: true, message: 'Repository connected' })
})

export const removeRepo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await queryOne<Repo>(
    'SELECT id FROM repos WHERE id = ? AND user_id = ?', [String(req.params.id), req.userId!]
  )
  if (!repo) { res.status(404).json({ success: false, error: 'Repo not found' }); return }
  await execute('DELETE FROM repos WHERE id = ?', [repo.id])
  res.json({ success: true, message: 'Repository removed' })
})