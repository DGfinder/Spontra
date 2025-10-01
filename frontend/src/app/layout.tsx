import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Spontra - Discover Your Next Adventure',
  description: 'Find destinations based on flight time and your travel style',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        {children}
      </body>
    </html>
  )
}