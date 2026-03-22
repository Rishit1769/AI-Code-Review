'use client'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'

interface Review {
  id: string
  pr_number: number
  pr_title: string
  pr_url: string
  pr_author: string
  repo_full_name: string
  status: 'pending' | 'completed' | 'failed'
  tokens_used: number
  created_at: string
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle size={16} className="text-green-400" />
  if (status === 'failed')    return <XCircle size={16} className="text-red-400" />
  return <Clock size={16} className="text-yellow-400 animate-pulse" />
}

export default function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">🤖</div>
        <h3 className="font-bold text-lg mb-2">No reviews yet</h3>
        <p className="text-gray-400 text-sm mb-4">
          Connect a GitHub repo and open a pull request to get your first AI review.
        </p>
        <a href="/settings"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Connect a Repo →
        </a>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="font-bold text-lg">Recent Reviews</h2>
      </div>
      <div className="divide-y divide-gray-800">
        {reviews.map((review) => (
          <div key={review.id} className="px-5 py-4 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <StatusIcon status={review.status} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {review.pr_title || `PR #${review.pr_number}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {review.repo_full_name} · PR #{review.pr_number} · by {review.pr_author}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-500">{formatDateTime(review.created_at)}</span>
                {review.pr_url && (
                  <a href={review.pr_url} target="_blank" rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-400 transition-colors">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
            {review.status === 'completed' && review.tokens_used > 0 && (
              <p className="text-xs text-gray-600 mt-1 ml-7">
                {review.tokens_used.toLocaleString()} tokens used
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}