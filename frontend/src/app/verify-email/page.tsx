'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link.')
      setVerifying(false)
      return
    }

    // Verify email automatically on page load
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (data.success) {
          setSuccess(true)
          // Redirect to home after 3 seconds
          setTimeout(() => router.push('/'), 3000)
        } else {
          setError(data.error || 'Verification failed')
        }
      } catch (err) {
        setError('An error occurred during verification')
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router])

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-4">Verifying Your Email...</h2>
            <p className="text-white/70">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-4">Email Verified!</h2>
            <p className="text-white/80 mb-6">
              Your email has been successfully verified. You now have full access to all Spontra features.
            </p>
            <p className="text-white/60 text-sm mb-6">
              Redirecting you to the home page...
            </p>
            <Button
              onClick={() => router.push('/')}
              variant="primary"
              className="w-full"
            >
              Start Exploring
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">Verification Failed</h2>
          <p className="text-white/80 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <p className="text-white/70 text-sm">
              This could mean:
            </p>
            <ul className="text-left text-white/70 text-sm space-y-2 mb-6">
              <li>• The verification link has expired (valid for 24 hours)</li>
              <li>• The link has already been used</li>
              <li>• The link is invalid or corrupted</li>
            </ul>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary" className="w-full">
                  Create New Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  )
}
