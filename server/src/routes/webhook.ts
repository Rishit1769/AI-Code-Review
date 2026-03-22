import { Router, Request, Response } from 'express'
import express from 'express'
import crypto from 'crypto'
import { queryOne, query, execute } from '../services/db'
import { reviewCodeDiff } from '../services/gemini'
import { getPRDiff, postPRComment } from '../services/github'
import { sendPaymentConfirmEmail } from '../services/mailer'
import { Repo, User, PLAN_LIMITS } from '../types'

export const webhookRouter = Router()

function verifyGitHub(rawBody: Buffer, sig: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  } catch { return false }
}

// Fix 7: timing-safe compare for Lemon Squeezy too
function verifyLemonSqueezy(rawBody: Buffer, sig: string): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.LS_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(sig,  'hex')
    )
  } catch { return false }
}

// ── GitHub PR webhook ──────────────────────────────────────────────────────
webhookRouter.post('/github', express.raw({ type: '*/*' }), async (req: Request, res: Response) => {
  const sig   = req.headers['x-hub-signature-256'] as string
  const event = req.headers['x-github-event']      as string

  if (!sig || !verifyGitHub(req.body as Buffer, sig)) {
    res.status(401).json({ error: 'Bad signature' }); return
  }
  if (event !== 'pull_request') { res.status(200).json({ message: 'Ignored' }); return }

  let payload: any
  try { payload = JSON.parse((req.body as Buffer).toString()) }
  catch { res.status(400).send(); return }

  const { action, pull_request, repository } = payload
  if (!['opened', 'synchronize'].includes(action)) {
    res.status(200).json({ message: 'Ignored' }); return
  }

  // Respond immediately — GitHub times out at 10s
  res.status(202).json({ message: 'Queued' })

  // Fix 5: wrap everything in try/catch and always update review status
  let reviewId: string | null = null
  try {
    const repo = await queryOne<Repo>(
      'SELECT * FROM repos WHERE github_id = ? AND active = TRUE', [repository.id]
    )
    if (!repo) return

    const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [repo.user_id])
    if (!user) return

    if (user.reviews_limit !== -1 && user.reviews_used >= user.reviews_limit) {
      await postPRComment(repository.owner.login, repository.name, pull_request.number,
        `## ⚠️ CodeReview AI — Review Limit Reached\n\nYou've used all **${user.reviews_limit} free reviews** this month.\n\n[Upgrade your plan](${process.env.CLIENT_URL}/pricing) to get unlimited reviews.`
      )
      return
    }

    // Insert pending review record
    await execute(
      `INSERT INTO reviews (repo_id, pr_number, pr_title, pr_url, pr_author, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [repo.id, pull_request.number, pull_request.title, pull_request.html_url, pull_request.user.login]
    )

    const review = await queryOne<{ id: string }>(
      `SELECT id FROM reviews WHERE repo_id = ? AND pr_number = ? AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [repo.id, pull_request.number]
    )
    if (!review) return
    reviewId = review.id

    const diff = await getPRDiff(repository.owner.login, repository.name, pull_request.number)
    if (!diff?.trim()) {
      // Fix 5: always mark failed, never leave pending
      await execute(`UPDATE reviews SET status = 'failed', error_message = 'Empty diff' WHERE id = ?`, [reviewId])
      return
    }

    const { feedback, tokensUsed } = await reviewCodeDiff(diff, pull_request.title, pull_request.user.login)

    await execute(
      `UPDATE reviews SET feedback = ?, tokens_used = ?, diff_size = ?, status = 'completed' WHERE id = ?`,
      [feedback, tokensUsed, diff.split('\n').length, reviewId]
    )
    await execute('UPDATE users SET reviews_used = reviews_used + 1 WHERE id = ?', [user.id])

    await postPRComment(
      repository.owner.login, repository.name, pull_request.number,
      `## 🤖 AI Code Review\n\n${feedback}\n\n---\n*[CodeReview AI](${process.env.CLIENT_URL}) · ${tokensUsed.toLocaleString()} tokens*`
    )
  } catch (err: any) {
    console.error('[Webhook/GH]', err.message)
    // Fix 5: mark review failed so it never stays pending
    if (reviewId) {
      await execute(
        `UPDATE reviews SET status = 'failed', error_message = ? WHERE id = ?`,
        [err.message?.slice(0, 500), reviewId]
      ).catch(() => {})
    }
  }
})

// ── Lemon Squeezy payment webhook ─────────────────────────────────────────
webhookRouter.post('/lemon', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['x-signature'] as string

  // Fix 7: timing-safe compare
  if (!sig || !verifyLemonSqueezy(req.body as Buffer, sig)) {
    res.status(401).json({ error: 'Bad signature' }); return
  }

  let payload: any
  try { payload = JSON.parse((req.body as Buffer).toString()) }
  catch { res.status(400).send(); return }

  // Always respond fast
  res.status(200).json({ received: true })

  const eventName      = payload.meta?.event_name      as string
  const lsEventId      = payload.data?.id?.toString()  as string
  const userId         = payload.meta?.custom_data?.user_id as string
  const variantId      = payload.data?.attributes?.variant_id?.toString() as string
  const subscriptionId = payload.data?.id?.toString()  as string
  const customerId     = payload.data?.attributes?.customer_id?.toString() as string

  const VARIANT_MAP: Record<string, string> = {
    [process.env.LS_VARIANT_SOLO    ?? '']: 'solo',
    [process.env.LS_VARIANT_TEAM    ?? '']: 'team',
    [process.env.LS_VARIANT_COMPANY ?? '']: 'company',
  }
  const plan = VARIANT_MAP[variantId ?? ''] ?? 'free'

  // Fix 6: idempotency — skip if this exact event was already processed
  try {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM payment_events WHERE ls_event_id = ?', [lsEventId]
    )
    if (existing) {
      console.log(`[Webhook/LS] Duplicate event ${lsEventId} — skipping`)
      return
    }
  } catch (e) { console.error('[Webhook/LS] Idempotency check failed:', e) }

  // Log event first (unique constraint prevents duplicate processing)
  try {
    await execute(
      `INSERT INTO payment_events (user_id, event_name, ls_event_id, plan, raw_payload)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, eventName, lsEventId, plan, JSON.stringify(payload).slice(0, 60000)]
    )
  } catch (e: any) {
    // Fix 6: duplicate key = already processed, bail out safely
    if (e.code === 'ER_DUP_ENTRY') {
      console.log(`[Webhook/LS] Event ${lsEventId} already logged — skipping`)
      return
    }
    console.error('[Webhook/LS] Log failed:', e)
  }

  if (!userId) { console.error('[Webhook/LS] No user_id in custom_data'); return }

  try {
    if (['subscription_created', 'subscription_updated'].includes(eventName)) {
      const limit = PLAN_LIMITS[plan] ?? 10
      await execute(
        `UPDATE users SET plan = ?, reviews_limit = ?, ls_subscription_id = ?, ls_customer_id = ? WHERE id = ?`,
        [plan, limit, subscriptionId, customerId, userId]
      )
      const user = await queryOne<User>('SELECT email, name FROM users WHERE id = ?', [userId])
      if (user) sendPaymentConfirmEmail(user.email, user.name, plan).catch(console.error)

    } else if (['subscription_cancelled', 'subscription_expired'].includes(eventName)) {
      await execute(
        `UPDATE users SET plan = 'free', reviews_limit = 10, ls_subscription_id = NULL WHERE id = ?`,
        [userId]
      )
    }
  } catch (err: any) {
    console.error('[Webhook/LS]', err.message)
  }
})