'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Plane, Users, Star, Map } from 'lucide-react'
import { ExplorationProgress } from './ExplorationProgress'
import { DestinationRecommendation } from '@/services/apiClient'
import { themeDestinationService } from '@/services/themeDestinationService'
import { EnhancedDestinationRecommendation } from '@/types/destinations'

interface CityOption {
  id: string
  name: string
  airport_code: string
  population: number
  flight_frequency: number // flights per week
  primary_theme: 'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature'
  secondary_themes: Array<{
    theme: 'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature'
    strength: number // 0.1-1.0
  }>
  is_hidden_gem: boolean
  estimated_price: string
  flight_duration: number // in hours
  description: string
  themeScores?: {
    party: number
    adventure: number
    learn: number
    shopping: number
    beach: number
  }
  highlights?: string[]
  bestMonths?: string[]
  countryName: string
  countryCode: string
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
  const [showDetails, setShowDetails] = useState(false)

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'party':
      case 'nightlife': return 'text-purple-400'
      case 'adventure': return 'text-orange-400'
      case 'learn':
      case 'culture': return 'text-blue-400'
      case 'shopping': return 'text-pink-400'
      case 'beach': return 'text-cyan-400'
      case 'food': return 'text-green-400'
      case 'nature': return 'text-emerald-400'
      default: return 'text-yellow-400'
    }
  }

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'party':
      case 'nightlife': return '🌃'
      case 'adventure': return '🏔️'
      case 'learn':
      case 'culture': return '🏛️'
      case 'shopping': return '🛍️'
      case 'beach': return '🏖️'
      case 'food': return '🍽️'
      case 'nature': return '🌿'
      default: return '✈️'
    }
  }

  const relevantSecondaryThemes = city.secondary_themes
    .filter(t => t.strength >= 0.3)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)

  const handleCardInteraction = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.type === 'click') {
      onClick()
    }
  }

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDetails(!showDetails)
  }

  return (
    <div
      className="group cursor-pointer w-full max-w-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={handleCardInteraction}
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

        {/* Mobile Info Button - visible on small screens */}
        <button
          onClick={toggleDetails}
          className="absolute bottom-3 right-3 sm:hidden w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/30 transition-all duration-300"
          aria-label="View details"
        >
          <span className="text-xs">ⓘ</span>
        </button>

        {/* Desktop Interaction Indicator */}
        <div className={`hidden sm:block absolute bottom-2 right-2 w-2 h-2 rounded-full transition-all duration-300 ${
          isHovered ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-white/20'
        }`}></div>

        {/* Details Modal - Desktop hover or Mobile toggle */}
        {(isHovered || showDetails) && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-full max-w-sm sm:max-w-md lg:w-80 z-50 mx-2">
            <div className="bg-black/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Mobile Close Button */}
              {showDetails && (
                <button
                  onClick={toggleDetails}
                  className="absolute top-2 right-2 sm:hidden w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white z-10"
                  aria-label="Close details"
                >
                  <span className="text-xs">×</span>
                </button>
              )}
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
  const [cities, setCities] = useState<CityOption[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    
    const loadCityData = async () => {
      try {
        console.log(`🏙️ Loading cities for ${country.name} with theme ${selectedTheme}`)
        
        // Try enhanced backend service first
        const isBackendHealthy = await themeDestinationService.healthCheck()
        
        if (isBackendHealthy && selectedTheme) {
          // Use backend theme destination service
          const destinations = await themeDestinationService.getDestinationsByCountryAndTheme(
            getCountryCode(country.name), 
            selectedTheme, 
            originAirport
          )
          
          if (!active) return
          
          // Transform backend destinations to CityOption format
          const transformedCities: CityOption[] = destinations.map((dest: EnhancedDestinationRecommendation) => ({
            id: dest.destination.id,
            name: dest.destination.city_name,
            airport_code: dest.destination.airport_code,
            population: 1000000, // Default population
            flight_frequency: Math.round(dest.averageFlightTime ? 50 / dest.averageFlightTime : 7),
            primary_theme: getPrimaryTheme(dest.themeScores || {}, selectedTheme),
            secondary_themes: getSecondaryThemes(dest.themeScores || {}),
            is_hidden_gem: (dest.destination.popularity_score || 0) < 70,
            estimated_price: dest.estimated_flight_price || '€200-400',
            flight_duration: dest.averageFlightTime || 2,
            description: dest.destination.description,
            themeScores: dest.themeScores,
            highlights: dest.highlights,
            bestMonths: dest.bestMonths,
            countryName: dest.destination.country_name,
            countryCode: dest.destination.country_code
          }))
          
          setCities(transformedCities)
        } else {
          // Fallback to legacy API
          const response = await fetch('/api/amadeus/cities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ countryName: country.name, origin: originAirport })
          })
          
          if (!active) return
          
          const json = await response.json()
          if (!json.ok) throw new Error(json.error || 'Failed to load cities')
          setCities(json.data as CityOption[])
        }
      } catch (e: any) {
        if (active) {
          console.error('City loading failed:', e)
          setError(e.message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    
    loadCityData()
    return () => { active = false }
  }, [country?.name, originAirport, selectedTheme])
  
  // Helper function to get country code from name (basic mapping)
  const getCountryCode = (countryName: string): string => {
    const countryMap: Record<string, string> = {
      'Spain': 'ES',
      'France': 'FR', 
      'Italy': 'IT',
      'Germany': 'DE',
      'United Kingdom': 'GB',
      'Portugal': 'PT',
      'Netherlands': 'NL',
      'Greece': 'GR',
      'Czech Republic': 'CZ',
      'Austria': 'AT',
      'Poland': 'PL',
      'Hungary': 'HU',
      'Croatia': 'HR',
      'Switzerland': 'CH',
      'Belgium': 'BE'
    }
    return countryMap[countryName] || countryName.slice(0, 2).toUpperCase()
  }
  
  // Helper to determine primary theme from scores
  const getPrimaryTheme = (scores: any, selectedTheme: string): 'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature' => {
    const validThemes: Array<'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature'> = 
      ['party', 'adventure', 'learn', 'shopping', 'beach', 'culture', 'food', 'nightlife', 'nature']
    
    if (scores && Object.keys(scores).length > 0) {
      const maxScore = Math.max(...Object.values(scores) as number[])
      const primary = Object.keys(scores).find(key => scores[key] === maxScore)
      if (primary && validThemes.includes(primary as any)) {
        return primary as 'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature'
      }
    }
    
    const defaultTheme = selectedTheme && validThemes.includes(selectedTheme as any) 
      ? selectedTheme as 'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature'
      : 'adventure'
    
    return defaultTheme
  }
  
  // Helper to get secondary themes from scores
  const getSecondaryThemes = (scores: any): Array<{theme: 'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature', strength: number}> => {
    if (!scores) return []
    
    const validThemes: Array<'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature'> = 
      ['party', 'adventure', 'learn', 'shopping', 'beach', 'culture', 'food', 'nightlife', 'nature']
    
    return Object.entries(scores)
      .map(([theme, score]) => ({ 
        theme: theme as 'party' | 'adventure' | 'learn' | 'shopping' | 'beach' | 'culture' | 'food' | 'nightlife' | 'nature', 
        strength: (score as number) / 100 
      }))
      .filter(({theme, strength}) => validThemes.includes(theme) && strength >= 0.3)
      .sort((a, b) => b.strength - a.strength)
      .slice(1, 4) // Skip primary, take next 3
  }

  // Sort cities by importance: population + flight frequency, with hidden gems getting slight boost
  const sortedCities = [...cities].sort((a, b) => {
    const aScore = (a.population / 1000000) + (a.flight_frequency / 10) + (a.is_hidden_gem ? 0.5 : 0)
    const bScore = (b.population / 1000000) + (b.flight_frequency / 10) + (b.is_hidden_gem ? 0.5 : 0)
    return bScore - aScore
  })

  const getActivityTheme = () => {
    switch (selectedTheme) {
      case 'adventure': return 'from-orange-900 via-amber-900 to-slate-900'
      case 'nature': return 'from-green-900 via-teal-900 to-slate-900'
      case 'shopping': return 'from-pink-900 via-rose-900 to-slate-900'
      case 'party': return 'from-purple-900 via-pink-900 to-slate-900'
      case 'learn': return 'from-blue-900 via-indigo-900 to-slate-900'
      // Legacy theme mappings for backward compatibility
      case 'nightlife': return 'from-purple-900 via-pink-900 to-slate-900'
      case 'culture': return 'from-blue-900 via-indigo-900 to-slate-900'
      case 'food': return 'from-green-900 via-emerald-900 to-slate-900'
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

      {/* Responsive Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-8xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 sm:space-x-3 text-white/70 hover:text-white transition-all duration-300 group px-2 sm:px-4 py-2 rounded-xl hover:bg-white/10 min-h-[44px]"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-light tracking-wide text-sm sm:text-base">Back to Results</span>
          </button>
          
          <div className="text-center flex-1 mx-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-wider text-white mb-1 sm:mb-2">
              {country.name}
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-white/60">
              <div className="flex items-center space-x-2">
                <Plane size={14} />
                <span className="text-xs sm:text-sm font-light tracking-wide">From {originAirport}</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
              <span className="hidden sm:inline text-xs sm:text-sm font-light tracking-wide">Curated destinations</span>
              {selectedTheme && (
                <>
                  <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-light tracking-wide capitalize">Best for {selectedTheme}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Map button - hidden on small screens */}
            <button 
              className="hidden lg:flex items-center space-x-2 text-white/60 hover:text-white/80 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-white/10 border border-white/20 hover:border-white/30"
              onClick={() => {
                console.log('Map discovery mode coming soon...')
              }}
            >
              <Map size={16} />
              <span className="text-sm font-light tracking-wide">Map</span>
            </button>
            
            <div className="text-right">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extralight text-white">{cities.length}</div>
              <div className="text-white/60 text-xs sm:text-sm font-light tracking-wider uppercase">Cities</div>
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

      {/* Responsive City Grid */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/80">Loading curated destinations...</p>
                <p className="text-white/50 text-sm mt-2">Finding the perfect cities for {selectedTheme} activities</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-20">
              <div className="text-red-400 mb-4">⚠️</div>
              <h3 className="text-white font-semibold mb-2">Unable to load destinations</h3>
              <p className="text-white/60 text-sm mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Cities Content */}
          {!loading && !error && (
            <>
              {/* Major Cities Section */}
              <div className="mb-8 sm:mb-12">
                <h2 className="text-white/60 text-xs sm:text-sm font-light tracking-widest uppercase mb-4 sm:mb-6 text-center">
                  Premier Destinations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 justify-items-center">
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
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20"></div>
                    <h2 className="text-white/60 text-xs sm:text-sm font-light tracking-widest uppercase mx-4 sm:mx-6">
                      Hidden Gems
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 justify-items-center">
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
            </>
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