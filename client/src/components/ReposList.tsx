'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Trash2, GitBranch, Lock, Globe } from 'lucide-react'

interface Repo {
  id: string
  name: string
  full_name: string
  private: boolean
  active: boolean
  created_at: string
}

export default function ReposList({
  repos, onRemove
}: {
  repos: Repo[]
  onRemove: (id: string) => void
}) {
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleRemove(id: string) {
    if (!confirm('Remove this repository?')) return
    setRemoving(id)
    try {
      await api.delete(`/api/repos/${id}`)
      onRemove(id)
    } catch (e) {
      alert('Failed to remove repository')
    } finally {
      setRemoving(null)
    }
  }

  if (repos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No repositories connected yet.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-800">
      {repos.map((repo) => (
        <div key={repo.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <GitBranch size={16} className="text-gray-500" />
            <div>
              <p className="font-medium text-sm">{repo.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {repo.private
                  ? <><Lock size={10} className="text-gray-500" /><span className="text-xs text-gray-500">Private</span></>
                  : <><Globe size={10} className="text-gray-500" /><span className="text-xs text-gray-500">Public</span></>
                }
              </div>
            </div>
          </div>
          <button
            onClick={() => handleRemove(repo.id)}
            disabled={removing === repo.id}
            className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}