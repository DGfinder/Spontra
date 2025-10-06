import { Suspense } from 'react'
import { HomePageClient } from './HomePageClient'
import { OrganizationStructuredData } from '@/components/StructuredData'

// Force dynamic rendering to support URL sync functionality
export const dynamic = 'force-dynamic'

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
