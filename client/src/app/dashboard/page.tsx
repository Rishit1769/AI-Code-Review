'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import StatsCards from '@/components/StatsCards'
import ReviewsList from '@/components/ReviewsList'

export default function DashboardPage() {
  const router  = useRouter()
  const [stats, setStats]     = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return }
    fetchData()

    // Show success message if redirected from payment
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      alert(`🎉 You're now on the ${params.get('plan')} plan!`)
    }
  }, [])

  async function fetchData() {
    try {
      const [statsRes, reviewsRes] = await Promise.all([
        api.get('/api/reviews/stats'),
        api.get('/api/reviews'),
      ])
      setStats(statsRes.data.data)
      setReviews(reviewsRes.data.data)
    } catch (e) {
      console.error('Failed to load dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-gray-800 rounded w-20 mb-3" />
                <div className="h-8 bg-gray-800 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Your AI code review activity</p>
          </div>
          <a href="/settings"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg
                       text-sm font-semibold transition-colors">
            + Connect Repo
          </a>
        </div>

        {stats && <StatsCards stats={stats} />}

        {stats?.plan === 'free' && stats?.reviews_used >= stats?.reviews_limit && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6
                          flex items-center justify-between">
            <p className="text-yellow-400 text-sm">
              ⚠️ You've used all your free reviews this month.
            </p>
            <a href="/pricing"
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1.5
                         rounded-lg text-sm font-bold transition-colors">
              Upgrade Now
            </a>
          </div>
        )}

        <ReviewsList reviews={reviews} />

      </div>
    </div>
  )
}