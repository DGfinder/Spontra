'use client'

import { useState, useEffect } from 'react'
import { useFooterVariant, type FooterVariant } from '@/lib/hooks/useFooterVariant'
import { FooterMinimal } from './FooterMinimal'
import { FooterFull } from './FooterFull'

interface FooterProps {
  /**
   * Explicitly set footer variant (overrides automatic detection)
   */
  variant?: FooterVariant

  /**
   * Current theme for adaptive accent colors
   * (e.g., 'adventure', 'nature', 'vibe', 'indulge', 'discover')
   */
  theme?: string

  className?: string
}

/**
 * Context-aware footer component
 *
 * Automatically selects the appropriate footer variant based on the current route:
 * - 'hidden': Admin pages (no footer)
 * - 'minimal': Immersive POI detail pages (subtle, doesn't break flow)
 * - 'full': Landing/search pages (SEO-rich with 100+ internal links)
 *
 * Footer is hidden on initial page load and reveals when user scrolls down 300px
 * for an immersive full-viewport hero experience.
 *
 * Can be overridden with explicit `variant` prop if needed.
 */
export function Footer({ variant: explicitVariant, theme, className }: FooterProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Auto-detect variant from route (unless explicitly set)
  const autoVariant = useFooterVariant()
  const variant = explicitVariant || autoVariant

  // Scroll detection for reveal animation
  useEffect(() => {
    const handleScroll = () => {
      // Show footer when scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hidden footer (admin pages, etc.)
  if (variant === 'hidden') {
    return null
  }

  // Common scroll reveal animation classes
  const revealClasses = `
    transition-all duration-500 ease-out
    ${isVisible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-full pointer-events-none'
    }
  `

  // Minimal footer (immersive pages)
  if (variant === 'minimal') {
    return <FooterMinimal theme={theme} className={`${className} ${revealClasses}`} />
  }

  // Full SEO footer (landing pages)
  return <FooterFull theme={theme} className={`${className} ${revealClasses}`} />
}
