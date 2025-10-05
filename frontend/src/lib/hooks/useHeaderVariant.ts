'use client'

import { usePathname } from 'next/navigation'

export type HeaderVariant = 'minimal' | 'full' | 'sticky' | 'hidden'

/**
 * Automatically determine which header variant to show based on current route
 *
 * - 'hidden': Admin pages, no header needed
 * - 'minimal': Immersive POI detail pages (floating, fades on scroll)
 * - 'sticky': Search results with SearchSummaryBar
 * - 'full': Landing pages, legal pages (full navigation)
 */
export function useHeaderVariant(): HeaderVariant {
  const pathname = usePathname()

  // Hide on admin pages
  if (pathname.startsWith('/admin')) {
    return 'hidden'
  }

  // Minimal on immersive POI detail pages
  // Pattern: /destinations/[city]/[theme] or /destinations/[id]
  if (pathname.match(/^\/destinations\/[^/]+\/[^/]+/)) {
    return 'minimal' // Theme-specific destination pages
  }

  if (pathname.match(/^\/destinations\/[^/]+$/)) {
    return 'minimal' // Individual destination pages
  }

  // Note: 'sticky' variant is handled by SearchSummaryBar component
  // which is rendered conditionally in page.tsx based on search state
  // So we return 'full' here and let the page decide to show SearchSummaryBar

  // Full header on all other pages
  // - Homepage (/)
  // - Time-based search (/from/...)
  // - Legal pages (/privacy, /terms, etc.)
  return 'full'
}
