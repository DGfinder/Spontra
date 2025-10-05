'use client'

import { useHeaderVariant, type HeaderVariant } from '@/lib/hooks/useHeaderVariant'
import { HeaderMinimal } from './HeaderMinimal'
import { HeaderFull } from './HeaderFull'

interface HeaderProps {
  /**
   * Explicitly set header variant (overrides automatic detection)
   */
  variant?: HeaderVariant

  /**
   * Current theme for adaptive accent colors
   * (e.g., 'adventure', 'nature', 'vibe', 'indulge', 'discover')
   */
  theme?: string

  className?: string
}

/**
 * Context-aware header component
 *
 * Automatically selects the appropriate header variant based on the current route:
 * - 'hidden': Admin pages (no header)
 * - 'minimal': Immersive POI detail pages (floating, fades on scroll)
 * - 'full': Landing/search/legal pages (full navigation)
 *
 * Note: 'sticky' variant (SearchSummaryBar) is handled separately in page components
 * based on search state, not by this component.
 *
 * Can be overridden with explicit `variant` prop if needed.
 */
export function Header({ variant: explicitVariant, theme, className }: HeaderProps) {
  // Auto-detect variant from route (unless explicitly set)
  const autoVariant = useHeaderVariant()
  const variant = explicitVariant || autoVariant

  // Hidden header (admin pages, etc.)
  if (variant === 'hidden') {
    return null
  }

  // Sticky variant is handled by SearchSummaryBar component
  // which is rendered conditionally in page.tsx based on search state
  if (variant === 'sticky') {
    return null
  }

  // Minimal header (immersive POI pages)
  if (variant === 'minimal') {
    return <HeaderMinimal theme={theme} className={className} />
  }

  // Full header (landing pages, legal pages)
  return <HeaderFull theme={theme} className={className} />
}
