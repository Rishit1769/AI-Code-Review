export interface AuthUser {
  id: string
  email: string
  name: string
  verified: boolean
  plan: 'free' | 'solo' | 'team' | 'company'
  reviews_used: number
  reviews_limit: number
  ls_subscription_id: string | null
  github_username: string | null
  created_at: string
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  } catch { return null }
}

export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}