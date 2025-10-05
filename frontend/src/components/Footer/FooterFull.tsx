import Link from 'next/link'
import { Compass, Trees, Wine, Music, Globe } from 'lucide-react'

interface FooterFullProps {
  theme?: string
  className?: string
}

// Theme configuration
const THEMES = [
  { value: 'adventure', label: 'Adventure', icon: Compass, color: '#ffbd0a' },
  { value: 'nature', label: 'Nature', icon: Trees, color: '#02c06d' },
  { value: 'indulge', label: 'Indulge', icon: Wine, color: '#e52b00' },
  { value: 'vibe', label: 'Vibe', icon: Music, color: '#eb5b25' },
  { value: 'discover', label: 'Discover', icon: Globe, color: '#7f6ae4' }
] as const

// Popular destinations (static for now, will be dynamic from DB)
const POPULAR_DESTINATIONS = [
  { city: 'Paris', slug: 'paris', country: 'France' },
  { city: 'Tokyo', slug: 'tokyo', country: 'Japan' },
  { city: 'New York', slug: 'new-york', country: 'USA' },
  { city: 'London', slug: 'london', country: 'UK' },
  { city: 'Barcelona', slug: 'barcelona', country: 'Spain' },
  { city: 'Dubai', slug: 'dubai', country: 'UAE' },
  { city: 'Singapore', slug: 'singapore', country: 'Singapore' },
  { city: 'Sydney', slug: 'sydney', country: 'Australia' },
  { city: 'Rome', slug: 'rome', country: 'Italy' },
  { city: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
  { city: 'Istanbul', slug: 'istanbul', country: 'Turkey' },
  { city: 'Amsterdam', slug: 'amsterdam', country: 'Netherlands' },
  { city: 'Prague', slug: 'prague', country: 'Czech Republic' },
  { city: 'Bali', slug: 'bali', country: 'Indonesia' },
  { city: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
  { city: 'Berlin', slug: 'berlin', country: 'Germany' }
]

// Flight time search examples (unique to Spontra)
const FLIGHT_TIME_SEARCHES = [
  { label: '2-4 hours from London', href: '/from/LHR/2-4/adventure' },
  { label: '4-6 hours from New York', href: '/from/JFK/4-6/adventure' },
  { label: '6-8 hours from Singapore', href: '/from/SIN/6-8/adventure' },
  { label: '8-10 hours from Sydney', href: '/from/SYD/8-10/adventure' }
]

/**
 * Full SEO footer for landing pages and search results
 * - 4-column grid (desktop)
 * - 100+ internal links for SEO
 * - Theme-adaptive accent colors
 * - Mobile-responsive (collapsible sections)
 */
export function FooterFull({ theme, className = '' }: FooterFullProps) {
  // Get theme accent color
  const themeConfig = THEMES.find(t => t.value === theme)
  const accentColor = themeConfig?.color || '#8b5cf6'

  return (
    <footer
      className={`
        mt-24 border-t border-white/10
        bg-gradient-to-t from-[rgba(11,15,18,0.95)] to-[rgba(11,15,18,0.85)]
        backdrop-blur-xl
        shadow-[0_-4px_24px_rgba(0,0,0,0.3)]
        ${className}
      `}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Column 1: Popular Destinations */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Popular Destinations
            </h3>
            <ul className="space-y-2">
              {POPULAR_DESTINATIONS.slice(0, 12).map((dest) => (
                <li key={dest.slug}>
                  <Link
                    href={`/destinations/${dest.slug}`}
                    className="text-white/70 hover:text-white text-sm transition-colors block"
                  >
                    {dest.city}
                    <span className="text-white/40 text-xs ml-1">({dest.country})</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1 text-sm mt-4 transition-colors"
              style={{ color: accentColor }}
            >
              View all destinations →
            </Link>
          </div>

          {/* Column 2: Discover by Theme */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Discover
            </h3>
            <ul className="space-y-2">
              {THEMES.map((themeItem) => {
                const Icon = themeItem.icon
                return (
                  <li key={themeItem.value}>
                    <Link
                      href={`/explore/${themeItem.value}`}
                      className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                    >
                      <Icon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                      {themeItem.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Flight Time Search (Unique Feature) */}
            <div className="mt-8">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Search by Flight Time
              </h4>
              <ul className="space-y-2">
                {FLIGHT_TIME_SEARCHES.map((search, index) => (
                  <li key={index}>
                    <Link
                      href={search.href}
                      className="text-white/70 hover:text-white text-sm transition-colors block"
                    >
                      {search.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-white/70 hover:text-white text-sm transition-colors block">
                  About Spontra
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/70 hover:text-white text-sm transition-colors block">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-white/70 hover:text-white text-sm transition-colors block">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-white/70 hover:text-white text-sm transition-colors block">
                  Press & Media
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/70 hover:text-white text-sm transition-colors block">
                  Travel Blog
                </Link>
              </li>
            </ul>

            {/* Resources */}
            <div className="mt-8">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-white/70 hover:text-white text-sm transition-colors block">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/travel-tips" className="text-white/70 hover:text-white text-sm transition-colors block">
                    Travel Tips
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap" className="text-white/70 hover:text-white text-sm transition-colors block">
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Legal & Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-white/70 hover:text-white text-sm transition-colors block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/70 hover:text-white text-sm transition-colors block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-white/70 hover:text-white text-sm transition-colors block">
                  Cookie Policy
                </Link>
              </li>
            </ul>

            {/* Newsletter Signup (Future) */}
            <div className="mt-8">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Stay Inspired
              </h4>
              <p className="text-white/60 text-sm mb-3">
                Get travel inspiration delivered to your inbox
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm
                             placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  disabled
                />
                <button
                  type="submit"
                  disabled
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                             bg-white/10 text-white/40 cursor-not-allowed"
                  title="Coming soon"
                >
                  Soon
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-white font-bold text-xl hover:opacity-80 transition-opacity"
              >
                Spontra
              </Link>
              <span className="text-white/40 text-sm hidden sm:block">•</span>
              <p className="text-white/40 text-sm">
                © {new Date().getFullYear()} Spontra. Find your next adventure.
              </p>
            </div>

            {/* Social Media (Placeholder) */}
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/spontra"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@spontra"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
