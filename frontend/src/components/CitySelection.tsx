'use client'

import { useState } from 'react'
import { ArrowLeft, MapPin, Plane, Users, Star } from 'lucide-react'
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
      className="group cursor-pointer transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Main City Circle */}
      <div className="relative">
        {/* Hidden Gem Badge */}
        {city.is_hidden_gem && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
              <Star size={10} />
              <span>Hidden Gem</span>
            </div>
          </div>
        )}

        {/* City Circle */}
        <div className={`w-24 h-24 rounded-full border-2 border-white/30 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 group-hover:border-white/60 group-hover:bg-black/60 ${
          selectedTheme === city.primary_theme ? 'ring-2 ring-yellow-400' : ''
        }`}>
          <div className="text-center">
            <div className="text-sm font-semibold leading-tight">
              {city.name}
            </div>
            <div className="text-xs text-white/70 mt-1">
              {city.airport_code}
            </div>
          </div>
        </div>

        {/* Secondary Theme Indicators */}
        {relevantSecondaryThemes.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {relevantSecondaryThemes.map((theme, index) => (
                <div
                  key={theme.theme}
                  className="w-4 h-4 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xs"
                  title={`${theme.theme} (${Math.round(theme.strength * 100)}%)`}
                >
                  {getThemeIcon(theme.theme)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hover Details Card */}
        {isHovered && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-64 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-white text-sm">
              {/* City Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-yellow-400">{city.name}</h4>
                  <p className="text-xs text-white/70">{city.airport_code} • {Math.round(city.flight_duration * 10) / 10}h flight</p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">{city.estimated_price}</div>
                  <div className="text-xs text-white/70">from</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/90 text-xs mb-3 leading-relaxed">
                {city.description}
              </p>

              {/* Primary Theme */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-xs">Best for:</span>
                <span className={`text-xs font-medium flex items-center space-x-1 ${getThemeColor(city.primary_theme)}`}>
                  <span>{getThemeIcon(city.primary_theme)}</span>
                  <span className="capitalize">{city.primary_theme}</span>
                </span>
              </div>

              {/* Secondary Themes */}
              {relevantSecondaryThemes.length > 0 && (
                <div className="border-t border-white/20 pt-2">
                  <div className="text-white/70 text-xs mb-1">Also great for:</div>
                  <div className="flex flex-wrap gap-1">
                    {relevantSecondaryThemes.map((theme) => (
                      <span
                        key={theme.theme}
                        className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full capitalize"
                      >
                        {theme.theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="border-t border-white/20 pt-2 mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1 text-white/70">
                  <Users size={10} />
                  <span>{(city.population / 1000000).toFixed(1)}M people</span>
                </div>
                <div className="flex items-center space-x-1 text-white/70">
                  <Plane size={10} />
                  <span>{city.flight_frequency}/week</span>
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

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Countries</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              CHOOSE YOUR CITY IN {country.name.toUpperCase()}
            </h1>
            <p className="text-white/60 text-sm mt-2">
              From {originAirport} • Ordered by accessibility and discovery potential
              {selectedTheme && <span className="ml-2">• Best for {selectedTheme}</span>}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-white/80 text-sm">Found</div>
            <div className="text-yellow-400 font-semibold">{cities.length} Cities</div>
          </div>
        </div>
      </header>

      {/* Instructions */}
      <div className="relative z-10 text-center py-6">
        <p className="text-white/60 text-sm tracking-wider">
          Major destinations first • Scroll down to discover hidden gems • Hover for details
        </p>
      </div>

      {/* City Grid */}
      <main className="relative z-10 flex-1 px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
            {sortedCities.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                selectedTheme={selectedTheme}
                onClick={() => onCitySelect(city)}
              />
            ))}
          </div>

          {/* Discovery Encouragement */}
          <div className="text-center mt-12 pt-8 border-t border-white/10">
            <p className="text-white/50 text-sm">
              🔍 Scroll down to discover more hidden gems and off-the-beaten-path destinations
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}