import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { Arimo } from 'next/font/google'
import { BackgroundManager } from '@/components/BackgroundManager'
import { ToastContainer } from '@/components/ui/Toast'

const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-arimo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Spontra - Discover Your Next Adventure',
  description: 'Find destinations based on flight time and your travel style. AI-powered travel discovery.',
  keywords: 'travel, flights, destinations, spontaneous travel, adventure, vacation planning',
  openGraph: {
    title: 'Spontra - Discover Your Next Adventure',
    description: 'Find destinations based on flight time and your travel style',
    type: 'website',
    siteName: 'Spontra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spontra - Discover Your Next Adventure',
    description: 'Find destinations based on flight time and your travel style',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`h-full antialiased overflow-x-hidden ${arimo.variable}`}>
        <div className="relative min-h-full">
          {/* Dynamic Background Manager */}
          <BackgroundManager />

          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>

          {/* Toast Notifications */}
          <ToastContainer />
        </div>
      </body>
    </html>
  )
}