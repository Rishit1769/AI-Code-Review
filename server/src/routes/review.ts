import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { AddRepoSchema } from '../schemas'
import { listReviews, getReview, getStats, listRepos, addRepo, removeRepo } from '../controllers/review.controller'

export const reviewRouter = Router()
export const repoRouter   = Router()

reviewRouter.get('/',      requireAuth, listReviews)
reviewRouter.get('/stats', requireAuth, getStats)
reviewRouter.get('/:id',   requireAuth, getReview)

repoRouter.get('/',        requireAuth, listRepos)
repoRouter.post('/',       requireAuth, validate(AddRepoSchema), addRepo)
repoRouter.delete('/:id',  requireAuth, removeRepo)