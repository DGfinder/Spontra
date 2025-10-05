'use client'

import { usePathname } from 'next/navigation'

export type FooterVariant = 'minimal' | 'full' | 'hidden'

/**
 * Automatically determine which footer variant to show based on current route
 *
 * - 'hidden': Admin pages, no footer needed
 * - 'minimal': Immersive POI detail pages (Instagram-style feed)
 * - 'full': Landing pages, search results (needs SEO links)
 */
export function useFooterVariant(): FooterVariant {
  const pathname = usePathname()

  // Hide on admin pages
  if (pathname.startsWith('/admin')) {
    return 'hidden'
  }

  // Minimal on POI detail pages (immersive video feed)
  // Pattern: /destinations/[city]/[theme] or /destinations/[id]
  if (pathname.match(/^\/destinations\/[^/]+\/[^/]+/)) {
    return 'minimal' // Theme-specific destination pages
  }

  if (pathname.match(/^\/destinations\/[^/]+$/)) {
    return 'minimal' // Individual destination pages
  }

  // Full footer on all other pages
  // - Homepage (/)
  // - Time-based search (/from/...)
  // - Country grids
  // - Legal pages
  return 'full'
}
