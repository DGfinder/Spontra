'use client'

import { Inter } from 'next/font/google'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <ErrorBoundary 
          onError={(error, errorInfo) => {
            console.error('React Error Boundary:', error, errorInfo)
          }}
        >
          {children}
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}