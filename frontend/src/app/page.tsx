import { Suspense } from 'react'
import { HomePageClient } from './HomePageClient'

// Force dynamic rendering to support URL sync functionality
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  )
}
