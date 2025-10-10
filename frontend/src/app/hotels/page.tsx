import { Suspense } from 'react'
import { HotelsPageClient } from './HotelsPageClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Hotels - Find Your Perfect Stay | Spontra',
  description: 'Discover and book hotels for your next adventure. Compare prices across multiple providers.',
}

export default function HotelsPage() {
  return (
    <Suspense fallback={null}>
      <HotelsPageClient />
    </Suspense>
  )
}
