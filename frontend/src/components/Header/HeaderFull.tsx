'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { ExploreDropdown } from './ExploreDropdown'
import { HeaderMobileMenu } from './HeaderMobileMenu'

interface HeaderFullProps {
  theme?: string
  className?: string
}

/**
 * Full navigation header for landing pages and legal pages
 * - Spontra logo + navigation links
 * - Explore mega menu dropdown
 * - Mobile hamburger menu
 * - "Powered by Amadeus" attribution
 * - Scroll-aware transparency: transparent over backgrounds, adds glassmorphism on scroll
 */
export function HeaderFull({ theme, className = '' }: HeaderFullProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Add background after scrolling 100px
      setHasScrolled(currentScrollY > 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`
          sticky top-0 z-40
          transition-all duration-300
          ${hasScrolled
            ? 'bg-gradient-to-b from-[rgba(11,15,18,0.95)] to-[rgba(11,15,18,0.85)] backdrop-blur-xl border-b border-white/10 shadow-lg'
            : 'bg-transparent'
          }
          ${className}
        `}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              href="/"
              className="text-white font-bold text-xl hover:opacity-80 transition-opacity flex-shrink-0"
            >
              Spontra
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {/* Explore Dropdown */}
              <ExploreDropdown />

              {/* Destinations Link */}
              <Link
                href="/destinations"
                className="px-3 py-2 text-white/80 hover:text-white transition-colors"
              >
                Destinations
              </Link>

              {/* About Link */}
              <Link
                href="/about"
                className="px-3 py-2 text-white/80 hover:text-white transition-colors"
              >
                About
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Powered by Amadeus (Desktop only) */}
              <a
                href="https://amadeus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:block text-white/40 text-xs hover:text-white/60 transition-colors"
              >
                Powered by Amadeus
              </a>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <HeaderMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  )
}
