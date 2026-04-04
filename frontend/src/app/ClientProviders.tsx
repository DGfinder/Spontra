'use client'

import { Toaster } from 'sonner'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { UserAuthProvider } from '@/contexts/UserAuthContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import AffiliateDisclosure from '@/components/AffiliateDisclosure'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('React Error Boundary caught:', error, errorInfo)
      }}
    >
      <UserAuthProvider>
        {children}
      </UserAuthProvider>
      <AffiliateDisclosure
        showOnPages={['/', '/flights', '/search']}
        position="bottom"
      />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0e1520',
            border: '1px solid rgba(238,109,22,0.25)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
          },
          classNames: {
            success: 'border-orange-500/40',
            error: 'border-red-500/40',
          },
        }}
        richColors
      />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  )
}
