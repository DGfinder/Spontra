'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HeaderMinimalProps {
  theme?: string
  className?: string
}

/**
 * Minimal floating header for immersive POI pages
 * - Transparent overlay initially
 * - Fades out when scrolling down (after 200px)
 * - Reappears with glass background when scrolling up
 * - Doesn't break Instagram-style video feed immersion
 */
export function HeaderMinimal({ theme, className = '' }: HeaderMinimalProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollingDown = currentScrollY > lastScrollY
      const scrollingUp = currentScrollY < lastScrollY

      // Has scrolled past initial section (200px)
      setHasScrolled(currentScrollY > 200)

      // Hide when scrolling down after 200px, show when scrolling up
      if (currentScrollY > 200) {
        if (scrollingDown && currentScrollY > lastScrollY + 10) {
          setIsVisible(false)
        } else if (scrollingUp) {
          setIsVisible(true)
        }
      } else {
        // Always visible in first 200px
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        ${hasScrolled
          ? 'bg-gradient-to-b from-[rgba(11,15,18,0.95)] to-[rgba(11,15,18,0.85)] backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent'
        }
        ${className}
      `}
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-white font-bold text-xl hover:opacity-80 transition-opacity"
          >
            Spontra
          </Link>

          {/* Powered by Amadeus (subtle) */}
          <a
            href="https://amadeus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            Powered by Amadeus
          </a>
        </div>
      </div>
    </header>
  )
}
