'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('[Admin Login Client] Submitting login for:', email)
    console.log('[Admin Login Client] Current URL:', window.location.href)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin' // Ensure cookies are sent/received
      })

      const data = await response.json()
      console.log('[Admin Login Client] Response status:', response.status)
      console.log('[Admin Login Client] Response data:', data)
      console.log('[Admin Login Client] Response headers:', Object.fromEntries(response.headers.entries()))

      if (data.success) {
        console.log('[Admin Login Client] Login successful, redirecting to /admin/countries')
        router.push('/admin/countries')
      } else {
        console.error('[Admin Login Client] Login failed:', data.error)
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      console.error('[Admin Login Client] Network error:', err)
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple via-brand-blue to-brand-teal flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
        <p className="text-white/70 mb-8">Sign in to manage Spontra content</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              placeholder="admin@spontra.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-brand-purple px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
