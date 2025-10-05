'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin, Search, Plane, Compass, Trees, Wine, Music, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TimeInfo {
  label: string
  subtitle: string
  min: number
  max: number
  range: string
}

interface Airport {
  iataCode: string
  name: string
  city: string
  country: string
}

interface FlightTimeSelectorProps {
  timeRange: 'weekend' | 'week' | 'long-haul'
  timeInfo: TimeInfo
  airports: Airport[]
}

const THEMES = [
  { value: 'adventure', label: 'Adventure', icon: Compass, color: '#ffbd0a' },
  { value: 'nature', label: 'Nature', icon: Trees, color: '#02c06d' },
  { value: 'indulge', label: 'Indulge', icon: Wine, color: '#e52b00' },
  { value: 'vibe', label: 'Vibe', icon: Music, color: '#eb5b25' },
  { value: 'discover', label: 'Discover', icon: Globe, color: '#7f6ae4' }
] as const

/**
 * Flight time selector - choose departure airport for time-based search
 */
export function FlightTimeSelector({ timeRange, timeInfo, airports }: FlightTimeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAirport, setSelectedAirport] = useState<string | null>(null)
  const router = useRouter()

  // Filter airports by search query
  const filteredAirports = airports.filter(airport =>
    airport.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.iataCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group airports by region (simplified - by country for now)
  const airportsByCountry = filteredAirports.reduce((acc, airport) => {
    if (!acc[airport.country]) {
      acc[airport.country] = []
    }
    acc[airport.country].push(airport)
    return acc
  }, {} as Record<string, Airport[]>)

  const handleThemeSelect = (airportCode: string, theme: string) => {
    router.push(`/from/${airportCode}/${timeInfo.range}/${theme}`)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Title */}
          <div className="flex items-start gap-6 mb-8">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
              <Clock className="w-12 h-12 text-brand-gold" />
            </div>

            <div>
              <h1 className="text-5xl font-bold text-white mb-3">
                {timeInfo.label}
              </h1>
              <p className="text-2xl text-white/80 mb-2">
                {timeInfo.subtitle} from anywhere
              </p>
              <p className="text-white/60">
                Select your departure city to discover destinations within {timeInfo.subtitle} flight time
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by city, airport, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20
                         rounded-2xl text-white placeholder-white/40
                         focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent
                         transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Airport Selection */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {!selectedAirport ? (
          <div className="space-y-12">
            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-4">
                <Plane className="w-6 h-6 text-brand-gold mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    How it works
                  </h2>
                  <ol className="text-white/70 space-y-1 list-decimal list-inside">
                    <li>Choose your departure city below</li>
                    <li>Select a travel theme (adventure, nature, vibe, etc.)</li>
                    <li>Discover destinations within {timeInfo.subtitle}</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Airports by Country */}
            {Object.entries(airportsByCountry)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([country, countryAirports]) => (
                <section key={country} className="space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-white/60" />
                    {country}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countryAirports.map((airport) => (
                      <button
                        key={airport.iataCode}
                        onClick={() => setSelectedAirport(airport.iataCode)}
                        className="group text-left bg-white/5 backdrop-blur-xl rounded-xl p-4
                                 border border-white/10 hover:border-white/30
                                 hover:bg-white/10 transition-all duration-200
                                 hover:scale-[1.02]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-white truncate">
                                {airport.city}
                              </h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/80 font-medium flex-shrink-0">
                                {airport.iataCode}
                              </span>
                            </div>
                            <p className="text-sm text-white/60 truncate">
                              {airport.name}
                            </p>
                          </div>
                          <div className="text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0">
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}

            {/* No results */}
            {filteredAirports.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 max-w-md mx-auto">
                  <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">
                    No airports found
                  </h2>
                  <p className="text-white/60">
                    Try a different search term or clear the search to see all airports
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Theme Selection
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Back button */}
            <button
              onClick={() => setSelectedAirport(null)}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Change departure city
            </button>

            {/* Selected airport info */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Plane className="w-6 h-6 text-brand-gold" />
                <h2 className="text-2xl font-bold text-white">
                  Departing from {airports.find(a => a.iataCode === selectedAirport)?.city} ({selectedAirport})
                </h2>
              </div>
              <p className="text-white/60">
                Choose your travel theme to discover {timeInfo.subtitle} destinations
              </p>
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THEMES.map((theme) => {
                const Icon = theme.icon
                return (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeSelect(selectedAirport, theme.value)}
                    className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6
                             border border-white/10 hover:border-white/30
                             hover:bg-white/10 transition-all duration-200
                             hover:scale-[1.02] text-left overflow-hidden"
                  >
                    {/* Decorative gradient */}
                    <div
                      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, ${theme.color} 0%, transparent 100%)`
                      }}
                    />

                    <div className="relative">
                      <div className="flex items-start gap-4 mb-3">
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            backgroundColor: `${theme.color}30`
                          }}
                        >
                          <Icon className="w-8 h-8" style={{ color: theme.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {theme.label}
                          </h3>
                          <p className="text-white/60 text-sm">
                            Explore {theme.label.toLowerCase()} destinations
                          </p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors rotate-180" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
