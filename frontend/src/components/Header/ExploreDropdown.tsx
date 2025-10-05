'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Compass, Trees, Wine, Music, Globe, Clock, MapPin } from 'lucide-react'

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

const POPULAR_DESTINATIONS = [
  { city: 'Paris', country: 'France', slug: 'paris' },
  { city: 'Tokyo', country: 'Japan', slug: 'tokyo' },
  { city: 'New York', country: 'USA', slug: 'new-york' },
  { city: 'London', country: 'UK', slug: 'london' },
  { city: 'Barcelona', country: 'Spain', slug: 'barcelona' },
  { city: 'Dubai', country: 'UAE', slug: 'dubai' }
]

/**
 * Explore mega menu dropdown
 * Shows themes, flight times, and popular destinations in a grid
 */
export function ExploreDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 text-white/80 hover:text-white transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Explore
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mega Menu Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-[600px] max-w-[90vw]
                     bg-gradient-to-b from-[rgba(11,15,18,0.98)] to-[rgba(11,15,18,0.95)]
                     backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl
                     animate-scale-in"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Column 1: By Theme */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  By Theme
                </h3>
                <ul className="space-y-2">
                  {THEMES.map((theme) => {
                    const Icon = theme.icon
                    return (
                      <li key={theme.value}>
                        <Link
                          href={`/explore/${theme.value}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                                   text-white/70 hover:text-white hover:bg-white/10
                                   transition-colors group"
                        >
                          <Icon className="w-4 h-4" style={{ color: theme.color }} />
                          <span className="text-sm">{theme.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Column 2: By Flight Time */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  By Flight Time
                </h3>
                <ul className="space-y-2">
                  {FLIGHT_TIME_SEARCHES.map((search, index) => (
                    <li key={index}>
                      <Link
                        href={search.href}
                        onClick={() => setIsOpen(false)}
                        className="block px-2 py-1.5 rounded-lg
                                 text-white/70 hover:text-white hover:bg-white/10
                                 transition-colors"
                      >
                        <div className="text-sm">{search.label}</div>
                        <div className="text-xs text-white/50">{search.subtitle}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Popular Destinations */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Popular
                </h3>
                <ul className="space-y-2">
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <li key={dest.slug}>
                      <Link
                        href={`/destinations/${dest.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-2 py-1.5 rounded-lg
                                 text-white/70 hover:text-white hover:bg-white/10
                                 transition-colors"
                      >
                        <div className="text-sm">{dest.city}</div>
                        <div className="text-xs text-white/50">{dest.country}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/destinations"
                  onClick={() => setIsOpen(false)}
                  className="block mt-3 px-2 py-1 text-sm text-brand-gold hover:underline"
                >
                  View all destinations →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
