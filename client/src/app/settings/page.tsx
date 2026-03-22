'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { useUser } from '@/hooks/useUser'
import Navbar from '@/components/Navbar'
import ReposList from '@/components/ReposList'
import PlanBadge from '@/components/PlanBadge'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [repos, setRepos]             = useState<any[]>([])
  const [reposLoading, setReposLoading] = useState(true)
  const [githubId, setGithubId]       = useState('')
  const [repoName, setRepoName]       = useState('')
  const [fullName, setFullName]       = useState('')
  const [adding, setAdding]           = useState(false)
  const [cancelling, setCancelling]   = useState(false)

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return }
    fetchRepos()
  }, [])

  async function fetchRepos() {
    try {
      const { data } = await api.get('/api/repos')
      setRepos(data.data)
    } catch (e) {
      console.error('Failed to load repos')
    } finally {
      setReposLoading(false) }
  }

  async function handleAddRepo() {
    if (!githubId || !repoName || !fullName) {
      alert('Please fill in all fields'); return
    }
    setAdding(true)
    try {
      await api.post('/api/repos', {
        github_id: parseInt(githubId),
        name: repoName,
        full_name: fullName,
        private: false,
      })
      setGithubId(''); setRepoName(''); setFullName('')
      await fetchRepos()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to add repository')
    } finally { setAdding(false) }
  }

  async function handleCancelSubscription() {
    if (!confirm('Cancel your subscription? You will be downgraded to the free plan immediately.')) return
    setCancelling(true)
    try {
      await api.post('/api/payments/cancel')
      alert('Subscription cancelled. You are now on the free plan.')
      window.location.reload()
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to cancel')
    } finally { setCancelling(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black mb-8">Settings</h1>

        {/* Account */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Account</h2>
          {userLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-48 animate-pulse" />
              <div className="h-4 bg-gray-800 rounded w-32 animate-pulse" />
            </div>
          ) : user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Name</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Plan</span>
                <PlanBadge plan={user.plan} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Reviews used</span>
                <span className="font-medium">
                  {user.reviews_used} / {user.reviews_limit === -1 ? '∞' : user.reviews_limit}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Billing */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Billing</h2>
          {user?.plan === 'free' ? (
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">You're on the free plan.</p>
              <a href="/pricing"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2
                           rounded-lg text-sm font-bold transition-colors">
                Upgrade Plan
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Active subscription: <span className="text-white font-semibold capitalize">{user?.plan} plan</span>
              </p>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="text-red-400 hover:text-red-300 text-sm transition-colors
                           disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          )}
        </div>

        {/* Repositories */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-2">Connected Repositories</h2>
          <p className="text-gray-500 text-sm mb-6">
            Add your GitHub repo ID to receive AI reviews on pull requests.
            Find your repo ID at: <span className="text-blue-400">api.github.com/repos/owner/repo</span>
          </p>

          {/* Add repo form */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <input
              type="text"
              placeholder="GitHub Repo ID (number)"
              value={githubId}
              onChange={e => setGithubId(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                         text-sm text-white placeholder-gray-500 focus:outline-none
                         focus:border-blue-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Repo name (e.g. my-app)"
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                         text-sm text-white placeholder-gray-500 focus:outline-none
                         focus:border-blue-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Full name (e.g. rishit/my-app)"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                         text-sm text-white placeholder-gray-500 focus:outline-none
                         focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={handleAddRepo}
            disabled={adding}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg
                       text-sm font-bold transition-colors disabled:opacity-50 mb-6">
            {adding ? 'Adding...' : '+ Add Repository'}
          </button>

          {/* Repos list */}
          {reposLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <ReposList
              repos={repos}
              onRemove={(id) => setRepos(repos.filter(r => r.id !== id))}
            />
          )}
        </div>

      </div>
    </div>
  )
}