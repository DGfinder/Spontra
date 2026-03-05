'use client'

import { Inter, Mulish } from 'next/font/google'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { UserAuthProvider } from '@/contexts/UserAuthContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import AffiliateDisclosure from '@/components/AffiliateDisclosure'
// import { PerformanceTracker } from '@/components/PerformanceTracker' // Disabled for MVP build
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const mulish = Mulish({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-muli',
  display: 'swap'
})

// Metadata moved to page.tsx since client components can't export metadata
// Smart App Banner — once app is live on App Store, update the app-id below

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* iOS Smart App Banner — shows "Open in Spontra" on Safari mobile */}
        {/* TODO: update app-id once App Store listing is live */}
        <meta name="apple-itunes-app" content="app-id=PLACEHOLDER, app-argument=spontra://" />
      </head>
      <body className={`${inter.className} ${mulish.variable} h-full`}>
        <ErrorBoundary 
          onError={(error, errorInfo) => {
            // Log errors to console in production for debugging
            console.error('React Error Boundary caught:', error, errorInfo)
            
            // In a real app, you might want to send this to an error reporting service
            // like Sentry, LogRocket, or Bugsnag
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
              console.log('Error in production build - this would be sent to error reporting service')
            }
          }}
        >
          <UserAuthProvider>
            {children}
          </UserAuthProvider>
        </ErrorBoundary>
        <AffiliateDisclosure 
          showOnPages={['/', '/flights', '/search']}
          position="bottom"
        />
        <Analytics />
        <SpeedInsights />
        {/* <PerformanceTracker /> Disabled for MVP build */}
      </body>
    </html>
  )
}