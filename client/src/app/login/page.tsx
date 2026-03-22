'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { api } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import Link from 'next/link'

const EmailSchema = z.string().email('Enter a valid email address')

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep]         = useState<'email' | 'otp'>('email')
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleSendOTP() {
    setError('')
    const result = EmailSchema.safeParse(email)
    if (!result.success) { setError(result.error.issues[0]?.message ?? 'Enter a valid email address'); return }
    if (!name.trim()) { setError('Please enter your name'); return }

    setLoading(true)
    try {
      await api.post('/api/auth/send-otp', { email, name })
      setStep('otp')
      setCountdown(120)
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to send OTP. Try again.')
    } finally { setLoading(false) }
  }

  function handleOtpChange(val: string, idx: number) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus()
    // Auto-submit when all 6 digits entered
    if (val && idx === 5 && next.every(d => d)) {
      handleVerifyOTP(next.join(''))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  async function handleVerifyOTP(code?: string) {
    const otpCode = code || otp.join('')
    if (otpCode.length !== 6) { setError('Enter all 6 digits'); return }

    setLoading(true); setError('')
    try {
      const { data } = await api.post('/api/auth/verify-otp', { email, otp: otpCode })
      saveAuth(data.token, data.user)
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Wrong OTP. Try again.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    } finally { setLoading(false) }
  }

  const mins = Math.floor(countdown / 60)
  const secs = (countdown % 60).toString().padStart(2, '0')

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl">
            <span>⚡</span>
            <span>CodeReview <span className="text-blue-400">AI</span></span>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">
            {step === 'email' ? 'Sign in or Register' : 'Check your email'}
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            {step === 'email'
              ? 'No password needed — we send a code to your email'
              : `We sent a 6-digit code to ${email}`}
          </p>

          {step === 'email' ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Rishit Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                             text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                             focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                             text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                             focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg
                           font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Sending...' : 'Send Verification Code →'}
              </button>
            </>
          ) : (
            <>
              {/* OTP Input boxes */}
              <div className="flex gap-2 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputsRef.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    className="flex-1 h-14 bg-gray-800 border border-gray-700 rounded-lg
                               text-center text-2xl font-bold text-white
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                               focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerifyOTP()}
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg
                           font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3">
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                onClick={handleSendOTP}
                disabled={countdown > 0 || loading}
                className="w-full text-gray-400 hover:text-white text-sm py-2
                           transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {countdown > 0 ? `Resend code in ${mins}:${secs}` : 'Resend code'}
              </button>

              <button
                onClick={() => { setStep('email'); setOtp(['','','','','','']); setError('') }}
                className="w-full text-gray-600 hover:text-gray-400 text-sm py-2 transition-colors">
                ← Use different email
              </button>
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}