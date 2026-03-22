import { Request } from 'express'

// Fix 2: userId optional so plain Request handlers stay compatible
export interface AuthRequest extends Request {
  userId?: string
  userPlan?: string
}

export interface User {
  id: string
  email: string
  name: string
  verified: boolean
  plan: 'free' | 'solo' | 'team' | 'company'
  reviews_used: number
  reviews_limit: number
  ls_subscription_id: string | null
  ls_customer_id: string | null
  github_username: string | null
  github_token?: string | null
  created_at: string
  updated_at: string
}

export interface Repo {
  id: string
  user_id: string
  github_id: number
  name: string
  full_name: string
  install_id: number | null
  private: boolean
  active: boolean
  created_at: string
}

export interface Review {
  id: string
  repo_id: string
  pr_number: number
  pr_title: string
  pr_url: string
  pr_author: string
  diff_size: number
  feedback: string | null
  tokens_used: number
  status: 'pending' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
}

export const PLAN_LIMITS: Record<string, number> = {
  free:    10,
  solo:    -1,
  team:    -1,
  company: -1,
}

// Fix 10: validate all required env vars at startup, fail fast with clear errors
const REQUIRED_ENV = [
  'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME',
  'JWT_SECRET',
  'GMAIL_USER', 'GMAIL_PASS',
  'GEMINI_API_KEY',
  'GITHUB_WEBHOOK_SECRET', 'GITHUB_TOKEN',
  'LEMON_API_KEY', 'LS_STORE_ID',
  'LS_WEBHOOK_SECRET',
  'LS_VARIANT_SOLO', 'LS_VARIANT_TEAM', 'LS_VARIANT_COMPANY',
]

export function validateEnv(): void {
  const missing = REQUIRED_ENV.filter(k => !process.env[k])
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(k => console.error(`   - ${k}`))
    console.error('\nCopy .env.example to .env and fill in all values.')
    process.exit(1)
  }
  console.log('✅ Environment variables validated')
}