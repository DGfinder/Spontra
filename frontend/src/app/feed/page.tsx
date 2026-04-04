import { Suspense } from 'react'
import { FeedPageClient } from './FeedPageClient'

export const metadata = {
  title: 'Discover | Spontra',
}

export default function FeedPage() {
  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center text-white/40">
          Loading...
        </div>
      }>
        <FeedPageClient />
      </Suspense>
    </div>
  )
}
