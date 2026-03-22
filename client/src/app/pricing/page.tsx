'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0,
    features: ['10 PR reviews/month', '1 repo', 'Basic review', 'Community support'],
    cta: 'Get Started Free',
  },
  {
    id: 'solo', name: 'Solo', price: 19, popular: true,
    features: ['Unlimited PR reviews', 'All repos', 'Full AI review', 'Email support', 'Review history'],
    cta: 'Start Solo Plan',
  },
  {
    id: 'team', name: 'Team', price: 49,
    features: ['Everything in Solo', 'Up to 5 developers', 'Priority support', 'Team dashboard'],
    cta: 'Start Team Plan',
  },
  {
    id: 'company', name: 'Company', price: 149,
    features: ['Everything in Team', 'Unlimited developers', 'SLA support', 'Custom rules (soon)', 'Slack (soon)'],
    cta: 'Start Company Plan',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(planId: string) {
    if (planId === 'free') { router.push('/login'); return }

    if (!getToken()) {
      router.push('/login?redirect=/pricing')
      return
    }

    setLoading(planId)
    try {
      const { data } = await api.post('/api/payments/checkout', { plan: planId })
      window.location.href = data.data.url
    } catch (e: any) {
      alert(e.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Simple, honest pricing</h1>
          <p className="text-gray-400 text-lg">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`relative bg-gray-900 rounded-2xl p-6 border transition-all
                ${plan.popular
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'border-gray-800 hover:border-gray-700'}`}>

              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h2 className="font-bold text-gray-400 text-sm uppercase tracking-wide mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 text-sm mb-1">/month</span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${plan.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'}`}>
                {loading === plan.id ? 'Redirecting...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from Settings. No questions asked.' },
              { q: 'What payment methods are accepted?', a: 'All major credit/debit cards including Visa and Mastercard.' },
              { q: 'Does it work with private repos?', a: 'Yes, all plans support private repositories.' },
              { q: 'How fast are the reviews?', a: 'Typically under 30 seconds after opening a PR.' },
            ].map(faq => (
              <div key={faq.q} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}