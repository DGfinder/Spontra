'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

/**
 * PageViewTracker Component
 *
 * Automatically tracks page views in Google Analytics when route changes
 * Respects cookie consent - only tracks if analytics cookies enabled
 */
export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      trackPageView(url)
    }
  }, [pathname, searchParams])

  // This component doesn't render anything
  return null
}
