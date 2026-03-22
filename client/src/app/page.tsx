import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20
                        rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          Powered by Gemini 2.5 Flash
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
          AI reviews your code<br />
          <span className="text-blue-400">in 30 seconds</span>
        </h1>

        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect your GitHub repo. Open a PR. Get a detailed AI code review posted
          as a comment — bugs, security issues, and performance tips. Instantly.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Link href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl
                       font-bold text-lg transition-all hover:scale-105">
            Start Free — No Card Needed
          </Link>
          <Link href="/pricing"
            className="border border-gray-700 hover:border-gray-500 text-gray-300
                       px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
            See Pricing
          </Link>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-6 text-left mb-20">
          {[
            { step: '01', title: 'Connect GitHub',   desc: 'Link your repository in one click from your dashboard.' },
            { step: '02', title: 'Open a PR',        desc: 'Create a pull request as you normally would.' },
            { step: '03', title: 'Get AI Review',    desc: 'AI posts a detailed review comment in under 30 seconds.' },
          ].map((s) => (
            <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-blue-400 font-mono text-sm font-bold mb-3">{s.step}</div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            { icon: '🐛', title: 'Bug Detection',      desc: 'Catches real bugs with line numbers before they hit production.' },
            { icon: '🔒', title: 'Security Scanning',  desc: 'Flags SQL injection, XSS, exposed secrets automatically.' },
            { icon: '⚡', title: '30 Second Reviews',  desc: 'Instant feedback the moment you open a pull request.' },
            { icon: '📊', title: 'Review History',     desc: 'Track all reviews across all your repos in one dashboard.' },
            { icon: '🎨', title: 'Code Quality',       desc: 'Naming, duplication, readability — all reviewed automatically.' },
            { icon: '💰', title: 'Affordable',         desc: 'Start free. Solo plan from $19/mo. Cancel anytime.' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 py-20 text-center">
        <h2 className="text-3xl font-black mb-4">Ready to ship better code?</h2>
        <p className="text-gray-400 mb-8">Join developers getting AI code reviews on every PR.</p>
        <Link href="/login"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl
                     font-bold text-lg transition-all hover:scale-105 inline-block">
          Get Started Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} CodeReview AI · Built with Gemini 2.5 Flash
      </footer>
    </div>
  )
}