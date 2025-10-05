'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X, Compass, Trees, Wine, Music, Globe, Clock, MapPin } from 'lucide-react'

const THEMES = [
  { value: 'adventure', label: 'Adventure', icon: Compass, color: '#ffbd0a' },
  { value: 'nature', label: 'Nature', icon: Trees, color: '#02c06d' },
  { value: 'indulge', label: 'Indulge', icon: Wine, color: '#e52b00' },
  { value: 'vibe', label: 'Vibe', icon: Music, color: '#eb5b25' },
  { value: 'discover', label: 'Discover', icon: Globe, color: '#7f6ae4' }
] as const

const FLIGHT_TIME_SEARCHES = [
  { label: 'Weekend Getaways', subtitle: '2-4 hours', href: '/explore/weekend' },
  { label: 'Week Trips', subtitle: '4-8 hours', href: '/explore/week' },
  { label: 'Long Haul', subtitle: '8+ hours', href: '/explore/long-haul' }
]

interface HeaderMobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Full-screen slide-in mobile menu
 * - Activated by hamburger button
 * - Shows all nav options in stacked format
 * - Smooth slide-in animation from right
 */
export function HeaderMobileMenu({ isOpen, onClose }: HeaderMobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Menu */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-gradient-to-b
                   from-[rgba(11,15,18,0.98)] to-[rgba(11,15,18,0.95)]
                   backdrop-blur-xl border-l border-white/20 z-[70]
                   overflow-y-auto animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-white font-bold text-xl">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-8">

          {/* By Theme */}
          <section>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">
              Explore by Theme
            </h3>
            <ul className="space-y-1">
              {THEMES.map((theme) => {
                const Icon = theme.icon
                return (
                  <li key={theme.value}>
                    <Link
                      href={`/explore/${theme.value}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                               text-white/70 hover:text-white hover:bg-white/10
                               transition-colors"
                    >
                      <Icon className="w-5 h-5" style={{ color: theme.color }} />
                      <span>{theme.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* By Flight Time */}
          <section>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">
              By Flight Time
            </h3>
            <ul className="space-y-1">
              {FLIGHT_TIME_SEARCHES.map((search, index) => (
                <li key={index}>
                  <Link
                    href={search.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                             text-white/70 hover:text-white hover:bg-white/10
                             transition-colors"
                  >
                    <Clock className="w-5 h-5 text-white/50" />
                    <div>
                      <div>{search.label}</div>
                      <div className="text-xs text-white/50">{search.subtitle}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Quick Links */}
          <section>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">
              Quick Links
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/destinations"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                           text-white/70 hover:text-white hover:bg-white/10
                           transition-colors"
                >
                  <MapPin className="w-5 h-5 text-white/50" />
                  <span>All Destinations</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                           text-white/70 hover:text-white hover:bg-white/10
                           transition-colors"
                >
                  <span>About Spontra</span>
                </Link>
              </li>
            </ul>
          </section>

          {/* Attribution */}
          <div className="pt-4 border-t border-white/10">
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
      </div>
    </>
  )
}
