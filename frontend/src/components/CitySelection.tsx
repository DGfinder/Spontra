'use client'

import { useState } from 'react'
import { ArrowLeft, MapPin, Plane, Users, Star, Map } from 'lucide-react'
import { ExplorationProgress } from './ExplorationProgress'

interface DestinationRecommendation {
  destination: {
    city_name: string
    country_name: string
    airport_code: string
  }
  flight_route: {
    total_duration_minutes: number
  }
  match_score: number
  estimated_flight_price?: string
  reason_for_recommendation?: string
}

interface CityOption {
  id: string
  name: string
  airport_code: string
  population: number
  flight_frequency: number // flights per week
  primary_theme: 'adventure' | 'culture' | 'food' | 'nightlife' | 'nature' | 'shopping'
  secondary_themes: Array<{
    theme: 'adventure' | 'culture' | 'food' | 'nightlife' | 'nature' | 'shopping'
    strength: number // 0.1-0.8
  }>
  is_hidden_gem: boolean
  estimated_price: string
  flight_duration: number // in hours
  description: string
}

interface CitySelectionProps {
  country: {
    name: string
    region: string
  }
  originAirport: string
  selectedTheme?: string
  onBack: () => void
  onCitySelect: (city: CityOption) => void
}

interface CityCardProps {
  city: CityOption
  selectedTheme?: string
  onClick: () => void
}

function CityCard({ city, selectedTheme, onClick }: CityCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'adventure': return 'text-orange-400'
      case 'culture': return 'text-blue-400'
      case 'food': return 'text-green-400'
      case 'nightlife': return 'text-purple-400'
      case 'nature': return 'text-emerald-400'
      case 'shopping': return 'text-pink-400'
      default: return 'text-yellow-400'
    }
  }

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'adventure': return '🏔️'
      case 'culture': return '🏛️'
      case 'food': return '🍽️'
      case 'nightlife': return '🌃'
      case 'nature': return '🌿'
      case 'shopping': return '🛍️'
      default: return '✈️'
    }
  }

  const relevantSecondaryThemes = city.secondary_themes
    .filter(t => t.strength >= 0.3)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
    >
      {/* Luxury Card Container */}
      <div className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 transition-all duration-500 ease-out ${
        isHovered 
          ? 'transform -translate-y-2 shadow-2xl shadow-black/30 border-white/40 bg-gradient-to-br from-white/15 to-white/8' 
          : 'shadow-lg shadow-black/10'
      } ${
        isPressed ? 'transform -translate-y-1 scale-98' : ''
      } ${
        selectedTheme === city.primary_theme ? 'ring-2 ring-yellow-400/60 ring-offset-2 ring-offset-transparent' : ''
      }`}>
        
        {/* Hidden Gem Badge */}
        {city.is_hidden_gem && (
          <div className="absolute -top-3 -right-3 z-10">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              <div className="flex items-center space-x-1.5 text-xs font-semibold tracking-wide">
                <Star size={12} fill="currentColor" />
                <span className="text-[10px] uppercase letter-spacing-wider">Hidden Gem</span>
              </div>
            </div>
          </div>
        )}

        {/* City Header */}
        <div className="text-center mb-4">
          <h3 className="text-white font-light text-xl tracking-wide leading-tight mb-1">
            {city.name}
          </h3>
          <div className="flex items-center justify-center space-x-2 text-white/60">
            <MapPin size={12} />
            <span className="text-sm font-medium tracking-wider uppercase">
              {city.airport_code}
            </span>
          </div>
        </div>

        {/* Flight Info */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-center">
            <div className="text-2xl font-light text-green-400 tracking-tight">
              {city.estimated_price}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider">from</div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <div className="text-lg font-light text-white/90">
              {Math.round(city.flight_duration * 10) / 10}h
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider">flight</div>
          </div>
        </div>

        {/* Primary Theme */}
        <div className="flex items-center justify-center mb-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm ${getThemeColor(city.primary_theme)}`}>
            <span className="text-lg">{getThemeIcon(city.primary_theme)}</span>
            <span className="text-sm font-medium capitalize tracking-wide">
              {city.primary_theme}
            </span>
          </div>
        </div>

        {/* Secondary Theme Indicators */}
        {relevantSecondaryThemes.length > 0 && (
          <div className="flex justify-center space-x-2">
            {relevantSecondaryThemes.map((theme, index) => (
              <div
                key={theme.theme}
                className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/20"
                title={`${theme.theme} (${Math.round(theme.strength * 100)}%)`}
              >
                <span className="text-xs">{getThemeIcon(theme.theme)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Luxury Interaction Indicator */}
        <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full transition-all duration-300 ${
          isHovered ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-white/20'
        }`}></div>

        {/* Luxury Hover Details Modal */}
        {isHovered && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-80 z-50">
            <div className="bg-black/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Header Section */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-light text-lg tracking-wide">{city.name}</h4>
                    <div className="flex items-center space-x-2 text-white/60 mt-1">
                      <MapPin size={12} />
                      <span className="text-sm tracking-wider uppercase">{city.airport_code}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-sm">{Math.round(city.flight_duration * 10) / 10}h flight</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-light text-green-400 tracking-tight">{city.estimated_price}</div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">from</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-6 py-4 border-b border-white/10">
                <p className="text-white/80 text-sm leading-relaxed font-light">
                  {city.description}
                </p>
              </div>

              {/* Themes Section */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm font-medium tracking-wide">BEST FOR</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 ${getThemeColor(city.primary_theme)}`}>
                    <span>{getThemeIcon(city.primary_theme)}</span>
                    <span className="text-sm font-medium capitalize">{city.primary_theme}</span>
                  </div>
                </div>

                {/* Secondary Themes */}
                {relevantSecondaryThemes.length > 0 && (
                  <div>
                    <div className="text-white/60 text-xs font-medium tracking-wide mb-2 uppercase">Also Great For</div>
                    <div className="flex flex-wrap gap-2">
                      {relevantSecondaryThemes.map((theme) => (
                        <span
                          key={theme.theme}
                          className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full capitalize font-medium tracking-wide"
                        >
                          {theme.theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users size={14} className="text-white/40" />
                    <span className="text-white/70 font-light">
                      {(city.population / 1000000).toFixed(1)}M people
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Plane size={14} className="text-white/40" />
                    <span className="text-white/70 font-light">
                      {city.flight_frequency} flights/week
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CitySelection({ country, originAirport, selectedTheme, onBack, onCitySelect }: CitySelectionProps) {
  // Sample city data - in real implementation, this would come from the API based on selected country
  const generateCityOptions = (): CityOption[] => {
    const baseCities: Omit<CityOption, 'estimated_price' | 'flight_duration'>[] = [
      {
        id: 'madrid',
        name: 'Madrid',
        airport_code: 'MAD',
        population: 3200000,
        flight_frequency: 45,
        primary_theme: 'culture',
        secondary_themes: [
          { theme: 'food', strength: 0.7 },
          { theme: 'nightlife', strength: 0.6 },
          { theme: 'shopping', strength: 0.4 }
        ],
        is_hidden_gem: false,
        description: 'Spain\'s vibrant capital with world-class museums, royal palaces, and legendary tapas culture.'
      },
      {
        id: 'barcelona',
        name: 'Barcelona',
        airport_code: 'BCN',
        population: 1600000,
        flight_frequency: 42,
        primary_theme: 'culture',
        secondary_themes: [
          { theme: 'food', strength: 0.8 },
          { theme: 'nightlife', strength: 0.7 },
          { theme: 'adventure', strength: 0.4 }
        ],
        is_hidden_gem: false,
        description: 'Artistic Mediterranean city famous for Gaudí architecture, beaches, and innovative cuisine.'
      },
      {
        id: 'valencia',
        name: 'Valencia',
        airport_code: 'VLC',
        population: 800000,
        flight_frequency: 18,
        primary_theme: 'food',
        secondary_themes: [
          { theme: 'culture', strength: 0.6 },
          { theme: 'adventure', strength: 0.5 },
          { theme: 'nature', strength: 0.4 }
        ],
        is_hidden_gem: true,
        description: 'Birthplace of paella with futuristic architecture, beautiful beaches, and authentic Spanish culture.'
      },
      {
        id: 'seville',
        name: 'Seville',
        airport_code: 'SVQ',
        population: 690000,
        flight_frequency: 12,
        primary_theme: 'culture',
        secondary_themes: [
          { theme: 'food', strength: 0.7 },
          { theme: 'nightlife', strength: 0.5 }
        ],
        is_hidden_gem: true,
        description: 'Andalusian jewel with Moorish architecture, flamenco dancing, and enchanting old-world charm.'
      },
      {
        id: 'bilbao',
        name: 'Bilbao',
        airport_code: 'BIO',
        population: 345000,
        flight_frequency: 8,
        primary_theme: 'culture',
        secondary_themes: [
          { theme: 'food', strength: 0.8 },
          { theme: 'adventure', strength: 0.4 }
        ],
        is_hidden_gem: true,
        description: 'Basque cultural capital with the iconic Guggenheim Museum and extraordinary pintxos cuisine.'
      },
      {
        id: 'malaga',
        name: 'Málaga',
        airport_code: 'AGP',
        population: 574000,
        flight_frequency: 25,
        primary_theme: 'adventure',
        secondary_themes: [
          { theme: 'culture', strength: 0.5 },
          { theme: 'food', strength: 0.6 },
          { theme: 'nature', strength: 0.7 }
        ],
        is_hidden_gem: false,
        description: 'Costa del Sol gateway with beautiful beaches, historic center, and gateway to Andalusia.'
      }
    ]

    // Add price and duration estimates
    return baseCities.map(city => ({
      ...city,
      estimated_price: `€${220 + Math.floor(Math.random() * 180)}`,
      flight_duration: 2.5 + Math.random() * 1.5
    }))
  }

  const cities = generateCityOptions()

  // Sort cities by importance: population + flight frequency, with hidden gems getting slight boost
  const sortedCities = [...cities].sort((a, b) => {
    const aScore = (a.population / 1000000) + (a.flight_frequency / 10) + (a.is_hidden_gem ? 0.5 : 0)
    const bScore = (b.population / 1000000) + (b.flight_frequency / 10) + (b.is_hidden_gem ? 0.5 : 0)
    return bScore - aScore
  })

  const getActivityTheme = () => {
    switch (selectedTheme) {
      case 'nightlife': return 'from-purple-900 via-pink-900 to-slate-900'
      case 'adventure': return 'from-orange-900 via-amber-900 to-slate-900'
      case 'culture': return 'from-blue-900 via-indigo-900 to-slate-900'
      case 'food': return 'from-green-900 via-emerald-900 to-slate-900'
      case 'nature': return 'from-green-900 via-teal-900 to-slate-900'
      case 'shopping': return 'from-pink-900 via-rose-900 to-slate-900'
      default: return 'from-slate-900 via-slate-800 to-slate-900'
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getActivityTheme()} text-white relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      {/* Progress Indicator */}
      <ExplorationProgress 
        currentStep="cities"
        destination={{ city_name: 'Cities', country_name: country.name }}
      />

      {/* Luxury Header */}
      <header className="relative z-10 px-8 py-8 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-8xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center space-x-3 text-white/70 hover:text-white transition-all duration-300 group px-4 py-2 rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-light tracking-wide">Back to Countries</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-extralight tracking-wider text-white mb-2">
              {country.name}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-white/60">
              <div className="flex items-center space-x-2">
                <Plane size={14} />
                <span className="text-sm font-light tracking-wide">From {originAirport}</span>
              </div>
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              <span className="text-sm font-light tracking-wide">Curated by accessibility</span>
              {selectedTheme && (
                <>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <span className="text-sm font-light tracking-wide capitalize">Best for {selectedTheme}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Optional Map Discovery Toggle */}
            <button 
              className="flex items-center space-x-2 text-white/60 hover:text-white/80 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-white/10 border border-white/20 hover:border-white/30"
              onClick={() => {
                // TODO: Implement map modal
                console.log('Map discovery mode coming soon...')
              }}
            >
              <Map size={16} />
              <span className="text-sm font-light tracking-wide">Explore on Map</span>
            </button>
            
            <div className="text-right">
              <div className="text-3xl font-extralight text-white">{cities.length}</div>
              <div className="text-white/60 text-sm font-light tracking-wider uppercase">Cities</div>
            </div>
          </div>
        </div>
      </header>

      {/* Luxury Instructions */}
      <div className="relative z-10 text-center py-8">
        <p className="text-white/50 text-sm font-light tracking-wider leading-relaxed">
          Premium destinations curated by population and accessibility<br />
          <span className="text-white/40">Discover hidden gems as you explore further</span>
        </p>
      </div>

      {/* Luxury City Grid */}
      <main className="relative z-10 flex-1 px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Major Cities Section */}
          <div className="mb-12">
            <h2 className="text-white/60 text-sm font-light tracking-widest uppercase mb-6 text-center">
              Premier Destinations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
              {sortedCities.slice(0, 3).map((city) => (
                <CityCard
                  key={city.id}
                  city={city}
                  selectedTheme={selectedTheme}
                  onClick={() => onCitySelect(city)}
                />
              ))}
            </div>
          </div>

          {/* Hidden Gems Section */}
          {sortedCities.length > 3 && (
            <div className="relative">
              <div className="flex items-center mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20"></div>
                <h2 className="text-white/60 text-sm font-light tracking-widest uppercase mx-6">
                  Hidden Gems
                </h2>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
                {sortedCities.slice(3).map((city) => (
                  <CityCard
                    key={city.id}
                    city={city}
                    selectedTheme={selectedTheme}
                    onClick={() => onCitySelect(city)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Luxury Discovery Footer */}
          <div className="text-center mt-16 pt-8 border-t border-white/10">
            <div className="inline-flex items-center space-x-3 text-white/40">
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <span className="text-sm font-light tracking-wider">
                Each destination carefully curated for the discerning traveler
              </span>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}