interface Stats {
  plan: string
  reviews_used: number
  reviews_limit: number
  total_reviews: number
  repos_count: number
  monthly_reviews: number
}

export default function StatsCards({ stats }: { stats: Stats }) {
  const limitText = stats.reviews_limit === -1
    ? 'Unlimited'
    : `${stats.reviews_used} / ${stats.reviews_limit}`

  const usagePercent = stats.reviews_limit === -1
    ? 100
    : Math.min(100, Math.round((stats.reviews_used / stats.reviews_limit) * 100))

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Reviews</p>
        <p className="text-3xl font-black text-white">{stats.monthly_reviews}</p>
        <p className="text-xs text-gray-500 mt-1">{limitText} used</p>
        {stats.reviews_limit !== -1 && (
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Reviews</p>
        <p className="text-3xl font-black text-white">{stats.total_reviews}</p>
        <p className="text-xs text-gray-500 mt-1">All time</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Repos Connected</p>
        <p className="text-3xl font-black text-white">{stats.repos_count}</p>
        <p className="text-xs text-gray-500 mt-1">GitHub repos</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Plan</p>
        <p className="text-3xl font-black text-white capitalize">{stats.plan}</p>
        {stats.plan === 'free' && (
          <a href="/pricing" className="text-xs text-blue-400 hover:underline mt-1 block">
            Upgrade →
          </a>
        )}
      </div>

    </div>
  )
}