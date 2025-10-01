'use client'

import React, { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): JSX.Element {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-3xl font-bold text-white mb-4">Something went wrong!</h2>
          <p className="text-white/80 mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="bg-white text-red-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}