'use client'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { getPlanColor } from '@/lib/utils'
import { LogOut, LayoutDashboard, Settings } from 'lucide-react'

export default function Navbar() {
  const { user, loading, logout } = useUser()

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">⚡</span>
          <span>CodeReview <span className="text-blue-400">AI</span></span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-gray-800 rounded animate-pulse" />
          ) : user ? (
            <>
              {/* Plan badge */}
              <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${getPlanColor(user.plan)}`}>
                {user.plan}
              </span>

              <Link href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <Link href="/settings"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                <Settings size={16} />
                Settings
              </Link>

              <button onClick={logout}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/login"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}