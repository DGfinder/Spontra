'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import Script from 'next/script'

// Declare Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId: string) => string
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailVerificationWarning, setEmailVerificationWarning] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileWidgetId = useRef<string | null>(null)

  // Initialize Turnstile when script loads
  const handleTurnstileLoad = () => {
    if (window.turnstile && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      turnstileWidgetId.current = window.turnstile.render('#turnstile-widget', {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          setTurnstileToken(token)
        },
        'error-callback': () => {
          setError('CAPTCHA verification failed. Please refresh and try again.')
        },
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailVerificationWarning(false)

    // Check for Turnstile token if enabled
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the CAPTCHA verification')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          turnstileToken: turnstileToken || undefined,
        })
      })

      const data = await response.json()

      if (data.success) {
        // Check if email verification is required
        if (data.emailVerificationRequired) {
          setEmailVerificationWarning(true)
        }

        // Redirect to home page
        router.push('/')
        router.refresh() // Refresh to update auth state
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Load Turnstile Script */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          onLoad={handleTurnstileLoad}
        />
      )}

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/70">Log in to your Spontra account</p>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white">
            {error}
          </div>
        )}

        {emailVerificationWarning && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-white">
            <p className="font-medium mb-1">⚠️ Email Not Verified</p>
            <p className="text-sm">
              Please check your email inbox and verify your email address. Some features may be limited until verification is complete.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-white font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-brand-blue transition-colors"
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-white font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-brand-blue text-sm hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-brand-blue transition-colors"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {/* Turnstile CAPTCHA Widget */}
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
            <div className="flex justify-center">
              <div id="turnstile-widget"></div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>

          <div className="text-center">
            <p className="text-white/70">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-blue font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
