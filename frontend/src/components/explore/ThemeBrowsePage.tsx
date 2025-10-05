'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, Sparkles, Compass, Trees, Wine, Music, Globe } from 'lucide-react'

const THEME_DATA = {
  adventure: {
    label: 'Adventure',
    tagline: 'Epic experiences for thrill-seekers',
    description: 'Hiking, surfing, skiing, skydiving & extreme sports',
    color: '#ffbd0a',
    icon: Compass
  },
  nature: {
    label: 'Nature',
    tagline: 'Breathtaking natural wonders',
    description: 'National parks, wildlife, mountains & pristine landscapes',
    color: '#02c06d',
    icon: Trees
  },
  indulge: {
    label: 'Indulge',
    tagline: 'Luxury & culinary excellence',
    description: 'Fine dining, wine tasting, spas & premium experiences',
    color: '#e52b00',
    icon: Wine
  },
  vibe: {
    label: 'Vibe',
    tagline: 'Nightlife & entertainment',
    description: 'Music festivals, bars, clubs & vibrant scenes',
    color: '#eb5b25',
    icon: Music
  },
  discover: {
    label: 'Discover',
    tagline: 'Culture & history awaits',
    description: 'Museums, historic sites, local traditions & cultural immersion',
    color: '#7f6ae4',
    icon: Globe
  }
} as const

interface CountryGroup {
  country: {
    name: string
    code: string
  }
  destinations: Array<{
    id: string
    cityName: string
    airportCode: string
    imageUrl?: string | null
    description?: string | null
    slug: string
    country: {
      name: string
      code: string
    }
  }>
}

interface ThemeBrowsePageProps {
  theme: string
  countryGroups: CountryGroup[]
  totalDestinations: number
}

/**
 * Theme browsing page - explore all destinations for a specific theme
 */
export function ThemeBrowsePage({ theme, countryGroups, totalDestinations }: ThemeBrowsePageProps) {
  const themeInfo = THEME_DATA[theme as keyof typeof THEME_DATA] || THEME_DATA.adventure
  const ThemeIcon = themeInfo.icon

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header
        className="relative border-b border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${themeInfo.color}15 0%, transparent 100%)`
        }}
      >
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${themeInfo.color} 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Title section */}
          <div className="flex items-start gap-6 mb-6">
            <div
              className="p-4 rounded-2xl backdrop-blur-xl border border-white/20"
              style={{
                backgroundColor: `${themeInfo.color}20`,
                borderColor: `${themeInfo.color}40`
              }}
            >
              <ThemeIcon className="w-12 h-12" style={{ color: themeInfo.color }} />
            </div>

            <div className="flex-1">
              <h1 className="text-5xl font-bold text-white mb-3">
                {themeInfo.label} Destinations
              </h1>
              <p className="text-2xl text-white/80 mb-2">
                {themeInfo.tagline}
              </p>
              <p className="text-white/60 max-w-3xl">
                {themeInfo.description}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white/60" />
              <span className="text-white/80">
                <strong className="text-white font-semibold">{totalDestinations}</strong> destinations
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white/60" />
              <span className="text-white/80">
                <strong className="text-white font-semibold">{countryGroups.length}</strong> countries
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {countryGroups.length > 0 ? (
          <div className="space-y-12">
            {countryGroups.map((group) => (
              <section key={group.country.code} className="space-y-4">
                {/* Country Header */}
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-3xl font-bold text-white">
                    {group.country.name}
                  </h2>
                  <span className="text-white/60 text-lg">
                    ({group.destinations.length} {group.destinations.length === 1 ? 'destination' : 'destinations'})
                  </span>
                </div>

                {/* Destinations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.destinations.map((destination) => (
                    <Link
                      key={destination.id}
                      href={`/destinations/${destination.slug}/${theme}`}
                      className="group bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden
                               border border-white/10 hover:border-white/30
                               hover:bg-white/10 transition-all duration-300
                               hover:scale-[1.02] hover:shadow-2xl"
                    >
                      {/* Destination Image */}
                      {destination.imageUrl ? (
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={destination.imageUrl}
                            alt={destination.cityName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      ) : (
                        <div
                          className="aspect-[16/10] flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${themeInfo.color}30, ${themeInfo.color}10)`
                          }}
                        >
                          <MapPin className="w-16 h-16 text-white/40" />
                        </div>
                      )}

                      {/* Destination Info */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-white group-hover:text-white/90 transition-colors">
                            {destination.cityName}
                          </h3>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: `${themeInfo.color}30`,
                              color: themeInfo.color
                            }}
                          >
                            {destination.airportCode}
                          </span>
                        </div>

                        {destination.description && (
                          <p className="text-white/60 text-sm line-clamp-2">
                            {destination.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
              <ThemeIcon className="w-16 h-16 mx-auto mb-4" style={{ color: themeInfo.color }} />
              <h2 className="text-2xl font-bold text-white mb-3">
                No {themeInfo.label.toLowerCase()} destinations yet
              </h2>
              <p className="text-white/60 mb-6">
                We're currently adding {themeInfo.label.toLowerCase()} destinations. Check back soon!
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold
                         text-white transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: themeInfo.color
                }}
              >
                Explore Other Themes
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
