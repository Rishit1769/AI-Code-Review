'use client'
import { useState, useEffect } from 'react'
import { AuthUser, getUser, getToken, clearAuth } from '@/lib/auth'
import { api } from '@/lib/api'

export function useUser() {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    // Load from localStorage first (instant)
    const cached = getUser()
    if (cached) setUser(cached)

    // Then refresh from API
    api.get('/api/auth/me')
      .then(({ data }) => {
        setUser(data.data)
        localStorage.setItem('user', JSON.stringify(data.data))
      })
      .catch(() => {
        clearAuth()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  function logout() {
    clearAuth()
    window.location.href = '/login'
  }

  return { user, loading, logout, setUser }
}