import { Suspense } from 'react'
import { SearchPage } from '@/components/SearchPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spontra - Discover Your Next Adventure',
  description: 'Find amazing destinations based on flight time and themes. Discover adventure, culture, nightlife and more.',
  keywords: 'travel, flights, destinations, adventure, culture, spontaneous travel',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading your adventure...</p>
          </div>
        </div>
      }>
        <SearchPage />
      </Suspense>
    </main>
  )
}