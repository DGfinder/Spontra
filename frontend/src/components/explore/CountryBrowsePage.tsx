'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, Sparkles, Plane, Clock, DollarSign } from 'lucide-react'

interface Destination {
  id: string
  cityName: string
  slug: string | null
  airportCode: string | null
  imageUrl: string | null
  description: string | null
  popularityScore: number | null
  flightDuration?: number
  priceEstimate?: string
  cheapestPrice?: number
  currency?: string
  themePOIs: Array<{
    theme: string
  }>
  airports: Array<{
    airportCode: string
    isPrimary: boolean
  }>
}

interface Country {
  id: string
  name: string
  code: string
  imageUrl: string | null
  mapSvg: string | null
  destinations: Destination[]
}

interface SearchContext {
  originAirport: string
  theme: string
  minFlightTime: number
  maxFlightTime: number
  departureDate: string
  returnDate: string
  passengers: number
}

interface CountryBrowsePageProps {
  country: Country
  searchContext?: SearchContext
  defaultTheme?: string
}

/**
 * Country browsing page - explore all destinations in a specific country
 */
export function CountryBrowsePage({ country, searchContext, defaultTheme = 'adventure' }: CountryBrowsePageProps) {
  // Determine active theme
  const activeTheme = searchContext?.theme || defaultTheme

  // Build back URL if we have search context
  const buildBackUrl = () => {
    if (!searchContext) {
      return '/'
    }

    const params = new URLSearchParams()
    params.set('from', searchContext.originAirport)
    params.set('theme', searchContext.theme)
    params.set('minTime', searchContext.minFlightTime.toString())
    params.set('maxTime', searchContext.maxFlightTime.toString())
    params.set('departure', searchContext.departureDate)
    params.set('return', searchContext.returnDate)
    params.set('passengers', searchContext.passengers.toString())

    return `/?${params.toString()}#results`
  }

  // Get primary airport code for each destination
  const getPrimaryAirport = (dest: Destination) => {
    const primaryAirport = dest.airports.find(a => a.isPrimary)
    return primaryAirport?.airportCode || dest.airports[0]?.airportCode || dest.airportCode || '???'
  }

  // Get theme color for destination
  const getDestinationTheme = (dest: Destination) => {
    const theme = dest.themePOIs[0]?.theme || activeTheme
    const themeColors: Record<string, string> = {
      adventure: '#ffbd0a',
      nature: '#02c06d',
      indulge: '#e52b00',
      vibe: '#eb5b25',
      discover: '#7f6ae4',
    }
    return { theme, color: themeColors[theme] || themeColors.adventure }
  }

  // Format flight time
  const formatFlightTime = (hours?: number) => {
    if (!hours) return null
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  // Get country flag emoji
  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍'
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header
        className="relative border-b border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)'
        }}
      >
        {/* Country image background (if available) */}
        {country.imageUrl && (
          <div className="absolute inset-0 opacity-10">
            <img
              src={country.imageUrl}
              alt={country.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          {/* Back link */}
          <Link
            href={buildBackUrl()}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {searchContext ? 'Back to Countries' : 'Back to Home'}
          </Link>

          {/* Search Context Summary */}
          {searchContext && (
            <div className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  <span>From <strong className="text-white">{searchContext.originAirport}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="capitalize"><strong className="text-white">{searchContext.theme}</strong> theme</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span><strong className="text-white">{searchContext.minFlightTime}-{searchContext.maxFlightTime}h</strong> flight time</span>
                </div>
              </div>
            </div>
          )}

          {/* Title section */}
          <div className="flex items-start gap-6 mb-6">
            {/* Country Flag/Map */}
            <div className="p-4 rounded-2xl backdrop-blur-xl border border-white/20 bg-white/10">
              {country.mapSvg ? (
                <div
                  className="w-16 h-16 flex items-center justify-center text-white"
                  dangerouslySetInnerHTML={{
                    __html: country.mapSvg
                      .replace(/fill="[^"]*"/gi, 'fill="currentColor"')
                      .replace(/stroke="[^"]*"/gi, 'stroke="currentColor"')
                      .replace(/<svg/, '<svg class="w-full h-full object-contain"')
                  }}
                />
              ) : (
                <span className="text-6xl leading-none" role="img" aria-label={`${country.name} flag`}>
                  {getCountryFlag(country.code)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-5xl font-bold text-white mb-3">
                {country.name}
              </h1>
              <p className="text-2xl text-white/80 mb-2">
                {searchContext
                  ? `${country.destinations.length} ${searchContext.theme.charAt(0).toUpperCase() + searchContext.theme.slice(1)} Destinations`
                  : 'Discover Amazing Destinations'
                }
              </p>
              <p className="text-white/60 max-w-3xl">
                {searchContext
                  ? `Matching your search from ${searchContext.originAirport} within ${searchContext.minFlightTime}-${searchContext.maxFlightTime} hours`
                  : `Explore cities, experiences, and adventures across ${country.name}`
                }
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white/60" />
              <span className="text-white/80">
                <strong className="text-white font-semibold">{country.destinations.length}</strong> destination{country.destinations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-white/60" />
              <span className="text-white/80">
                <strong className="text-white font-semibold">{new Set(country.destinations.flatMap(d => d.airports.map(a => a.airportCode))).size}</strong> airport{new Set(country.destinations.flatMap(d => d.airports.map(a => a.airportCode))).size !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white/60" />
              <span className="text-white/80">
                <strong className="text-white font-semibold">{new Set(country.destinations.flatMap(d => d.themePOIs.map(p => p.theme))).size}</strong> theme{new Set(country.destinations.flatMap(d => d.themePOIs.map(p => p.theme))).size !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {country.destinations.length > 0 ? (
          <div className="space-y-6">
            {/* Destinations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {country.destinations.map((destination) => {
                const airportCode = getPrimaryAirport(destination)
                const { theme, color } = getDestinationTheme(destination)
                const slug = destination.slug || slugify(destination.cityName)

                // Build destination URL with search context
                const destinationUrl = searchContext
                  ? `/destinations/${slug}/${theme}?from=${searchContext.originAirport}&departure=${searchContext.departureDate}&return=${searchContext.returnDate}&price=${destination.cheapestPrice || ''}&duration=${destination.flightDuration || ''}`
                  : `/destinations/${slug}/${theme}`

                return (
                  <Link
                    key={destination.id}
                    href={destinationUrl}
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
                          background: `linear-gradient(135deg, ${color}30, ${color}10)`
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
                            backgroundColor: `${color}30`,
                            color: color
                          }}
                        >
                          {airportCode}
                        </span>
                      </div>

                      {destination.description && (
                        <p className="text-white/60 text-sm line-clamp-2 mb-3">
                          {destination.description}
                        </p>
                      )}

                      {/* Flight Info - Show if available from search context */}
                      {searchContext && (destination.flightDuration || destination.priceEstimate) && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {destination.flightDuration && (
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{formatFlightTime(destination.flightDuration)}</span>
                            </div>
                          )}
                          {destination.cheapestPrice && (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <DollarSign className="w-4 h-4" />
                              <span>${destination.cheapestPrice.toFixed(0)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Theme badges */}
                      {destination.themePOIs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {destination.themePOIs.slice(0, 3).map((poi, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 capitalize"
                            >
                              {poi.theme}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h2 className="text-2xl font-bold text-white mb-3">
                No destinations yet
              </h2>
              <p className="text-white/60 mb-6">
                We're currently adding destinations in {country.name}. Check back soon!
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold
                         bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-105"
              >
                Explore Other Countries
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Helper: Convert text to URL slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}
