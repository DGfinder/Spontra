import React from 'react'
import './globals.css'
import type { Metadata } from 'next'

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
      <body className="h-full antialiased bg-linear-to-br from-brand-blue via-brand-indigo to-brand-purple overflow-x-hidden">
        <div className="relative min-h-full">
          {/* Background pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" 
            aria-hidden="true" 
          />
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}