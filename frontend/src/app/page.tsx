import { Suspense } from 'react'
import { HomePageClient } from './HomePageClient'
import { OrganizationStructuredData } from '@/components/StructuredData'

// ISR: Revalidate every 1 hour for improved performance
// Note: URL sync happens client-side via useUrlSync hook, so ISR is safe
export const revalidate = 3600

export default function HomePage() {
  return (
    <>
      {/* Organization Schema for SEO */}
      <OrganizationStructuredData />

      <Suspense fallback={null}>
        <HomePageClient />
      </Suspense>
    </>
  )
}
