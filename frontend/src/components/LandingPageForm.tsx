'use client'

import { useState, useEffect } from 'react'
import { AirportSearch } from './AirportSearch'
import { FlightTimeSlider } from './FlightTimeSlider'

interface FormData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime: number
}

interface CountryResult {
  name: string
  code: string
  flag: string
  cities: string[]
  averageFlightTime: number
  priceRange: string
  description: string
}

const THEMES = [
  { 
    id: 'adventure', 
    label: 'Adventure', 
    icon: '🏔️',
    background: '/adventure-background.jpg',
    color: 'orange'
  },
  { 
    id: 'activities', 
    label: 'Activities', 
    icon: '🎯',
    background: '/adventure-background.jpg',
    color: 'blue'
  },
  { 
    id: 'shopping', 
    label: 'Shopping', 
    icon: '🛍️',
    background: '/shopping-background.jpg',
    color: 'pink'
  },
  { 
    id: 'party', 
    label: 'Party', 
    icon: '🌃',
    background: '/party-background.jpg',
    color: 'purple'
  },
  { 
    id: 'learn', 
    label: 'Learn', 
    icon: '🎭',
    background: '/learn-background.jpg',
    color: 'green'
  }
]

const MOCK_COUNTRIES: CountryResult[] = [
  {
    name: "France",
    code: "FR",
    flag: "🇫🇷",
    cities: ["Paris", "Lyon", "Nice", "Marseille"],
    averageFlightTime: 2.5,
    priceRange: "€180-450",
    description: "Culture, cuisine, and romance"
  },
  {
    name: "Italy", 
    code: "IT",
    flag: "🇮🇹",
    cities: ["Rome", "Milan", "Venice", "Florence"],
    averageFlightTime: 3,
    priceRange: "€220-380",
    description: "Art, history, and amazing food"
  },
  {
    name: "Spain",
    code: "ES", 
    flag: "🇪🇸",
    cities: ["Barcelona", "Madrid", "Seville", "Valencia"],
    averageFlightTime: 2,
    priceRange: "€160-320",
    description: "Vibrant culture and beautiful beaches"
  },
  {
    name: "Germany",
    code: "DE",
    flag: "🇩🇪", 
    cities: ["Berlin", "Munich", "Hamburg", "Frankfurt"],
    averageFlightTime: 1.5,
    priceRange: "€120-280",
    description: "Rich history and modern cities"
  },
  {
    name: "Netherlands",
    code: "NL",
    flag: "🇳🇱",
    cities: ["Amsterdam", "Rotterdam", "The Hague"],
    averageFlightTime: 1,
    priceRange: "€90-240",
    description: "Canals, tulips, and friendly locals"
  },
  {
    name: "Portugal",
    code: "PT",
    flag: "🇵🇹",
    cities: ["Lisbon", "Porto", "Faro"],
    averageFlightTime: 2.5,
    priceRange: "€140-300",
    description: "Coastal beauty and historic charm"
  }
]

export function LandingPageForm() {
  const [formData, setFormData] = useState<FormData>({
    selectedTheme: 'adventure',
    departureAirport: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'return',
    maxFlightTime: 4
  })
  
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<CountryResult[]>([])

  const currentTheme = THEMES.find(t => t.id === formData.selectedTheme) || THEMES[0]

  // Preload background images for smooth transitions
  useEffect(() => {
    THEMES.forEach(theme => {
      const img = new Image()
      img.src = theme.background
    })
  }, [])

  const handleThemeSelect = (themeId: string) => {
    setFormData(prev => ({ ...prev, selectedTheme: themeId }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.departureAirport) {
      alert('Please select a departure airport')
      return
    }
    
    // Filter countries based on flight time
    const filteredCountries = MOCK_COUNTRIES.filter(
      country => country.averageFlightTime <= formData.maxFlightTime
    )
    
    // Implement flight time range logic: 0 to maxFlightTime
    const searchParams = {
      origin_airport_code: formData.departureAirport,
      min_flight_duration_hours: 0, // Always start from 0
      max_flight_duration_hours: formData.maxFlightTime, // User-selected maximum
      preferred_activities: [formData.selectedTheme],
      departure_date: formData.departureDate,
      return_date: formData.tripType === 'return' ? formData.returnDate : null,
      passengers: formData.passengers,
      trip_type: formData.tripType,
    }
    
    console.log('Search flights with optimized parameters:', searchParams)
    console.log(`Flight time range: 0 hours to ${formData.maxFlightTime} hours`)
    console.log(`Found ${filteredCountries.length} countries within ${formData.maxFlightTime} hours`)
    
    // Show results
    setSearchResults(filteredCountries)
    setShowResults(true)
  }
  
  const handleBackToSearch = () => {
    setShowResults(false)
    setSearchResults([])
  }

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative transition-all duration-1000 overflow-hidden"
      style={{ 
        backgroundImage: `url('${currentTheme.background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        height: '100vh'
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <span className="text-2xl font-light">spon</span>
            <span className="text-2xl font-bold">EXPLORE</span>
          </div>
          <div className="text-white/80 text-sm hover:text-white cursor-pointer">
            Sign In
          </div>
        </div>
      </div>

      {/* Left Form Panel with Dark Overlay */}
      <div className="absolute left-0 top-0 bottom-0 w-96 bg-black/80 backdrop-blur-sm z-20">
        <div className="p-6 h-full flex flex-col">
          {/* Form Header */}
          <div className="mb-6 pt-16">
            <h2 className="text-white text-lg font-medium mb-1">
              WHERE ARE YOU LOOKING TO GO?
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            {/* Theme Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-5 gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`p-3 rounded text-xs transition-all duration-200 ${
                      formData.selectedTheme === theme.id
                        ? 'bg-white text-black'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{theme.icon}</div>
                      <div className="text-xs font-medium">{theme.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Type Toggle */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-1 bg-white/20 rounded p-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tripType: 'return' }))}
                  className={`py-2 px-3 rounded text-sm transition-all ${
                    formData.tripType === 'return'
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  Return
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tripType: 'one-way' }))}
                  className={`py-2 px-3 rounded text-sm transition-all ${
                    formData.tripType === 'one-way'
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  One way
                </button>
              </div>
            </div>

            {/* From Airport */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                FROM
              </label>
              <AirportSearch
                value={formData.departureAirport}
                onChange={(code) => setFormData(prev => ({ 
                  ...prev, 
                  departureAirport: code 
                }))}
                placeholder="Type city or airport name"
              />
            </div>

            {/* To Airport - Disabled */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                TO
              </label>
              <input
                type="text"
                value="Anywhere"
                disabled
                className="w-full px-4 py-3 bg-white/20 text-white/60 rounded text-sm border-0"
              />
            </div>

            {/* Dates */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                DEPARTURE
              </label>
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {formData.tripType === 'return' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-white/90">
                  RETURN
                </label>
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
                  required={formData.tripType === 'return'}
                />
              </div>
            )}

            {/* Passengers */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-white/90">
                PASSENGERS
              </label>
              <select
                value={formData.passengers}
                onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white text-black rounded text-sm border-0 focus:ring-2 focus:ring-orange-500"
              >
                {[1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>

            {/* Flight Time Slider */}
            <div className="mb-6">
              <FlightTimeSlider
                value={formData.maxFlightTime}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  maxFlightTime: value 
                }))}
                min={0}
                max={12}
                step={0.5}
              />
            </div>

            {/* Search Button */}
            <div className="mt-auto">
              <button
                type="submit"
                disabled={!formData.departureAirport}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-sm transition-colors duration-200 shadow-lg"
              >
                SEARCH FLIGHTS
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Countries Results Overlay */}
      {showResults && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col">
          {/* Results Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Countries within {formData.maxFlightTime}h from {formData.departureAirport}
                </h2>
                <p className="text-white/70 mt-1">
                  Found {searchResults.length} destinations for your {formData.selectedTheme} adventure
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-white/50">Sorted by proximity:</span>
                  <span className="text-xs bg-orange-500/20 text-orange-200 px-2 py-1 rounded">
                    Closest first ✈️
                  </span>
                </div>
              </div>
              <button
                onClick={handleBackToSearch}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                ← Back to Search
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {searchResults
                .sort((a, b) => a.averageFlightTime - b.averageFlightTime) // Sort by flight time
                .map((country, index) => (
                <div
                  key={country.code}
                  className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-500 cursor-pointer border border-white/20 hover:border-orange-500/50 group hover:scale-105 hover:shadow-2xl ${
                    formData.selectedTheme === 'adventure' ? 'hover:bg-orange-500/10' :
                    formData.selectedTheme === 'party' ? 'hover:bg-purple-500/10' :
                    formData.selectedTheme === 'learn' ? 'hover:bg-green-500/10' :
                    formData.selectedTheme === 'shopping' ? 'hover:bg-pink-500/10' :
                    'hover:bg-blue-500/10'
                  }`}
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animation: 'slideInUp 0.6s ease-out forwards',
                    opacity: 0,
                    transform: 'translateY(30px)'
                  }}
                >
                  {/* Country Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{country.flag}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{country.name}</h3>
                        <p className="text-white/60 text-sm">{country.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Flight Info with Visual Indicators */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm flex items-center">
                        ✈️ Flight Time
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full transition-all duration-300 group-hover:bg-orange-400"
                            style={{ width: `${(country.averageFlightTime / formData.maxFlightTime) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-medium">{country.averageFlightTime}h</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm flex items-center">
                        💰 Price Range
                      </span>
                      <span className="text-white font-medium">{country.priceRange}</span>
                    </div>
                    
                    {/* Flight Path Hint on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center py-2">
                      <div className="text-white/60 text-xs flex items-center justify-center space-x-2">
                        <span>{formData.departureAirport}</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-orange-500/50 to-orange-500/20 relative">
                          <div className="absolute right-0 w-2 h-2 bg-orange-500 rounded-full transform translate-x-1"></div>
                        </div>
                        <span>{country.code}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cities */}
                  <div className="mb-4">
                    <p className="text-white/70 text-sm mb-2">Popular Cities</p>
                    <div className="flex flex-wrap gap-2">
                      {country.cities.slice(0, 3).map((city) => (
                        <span
                          key={city}
                          className="bg-orange-500/20 text-orange-200 px-2 py-1 rounded text-xs"
                        >
                          {city}
                        </span>
                      ))}
                      {country.cities.length > 3 && (
                        <span className="text-white/50 text-xs">
                          +{country.cities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Select Button with Theme Colors */}
                  <button className={`w-full text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                    formData.selectedTheme === 'adventure' ? 'bg-orange-500 hover:bg-orange-600' :
                    formData.selectedTheme === 'party' ? 'bg-purple-500 hover:bg-purple-600' :
                    formData.selectedTheme === 'learn' ? 'bg-green-500 hover:bg-green-600' :
                    formData.selectedTheme === 'shopping' ? 'bg-pink-500 hover:bg-pink-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}>
                    Explore {country.name} ✨
                  </button>
                </div>
              ))}
            </div>

            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <div className="text-white/60 text-lg">
                  No countries found within {formData.maxFlightTime} hours.
                </div>
                <div className="text-white/40 text-sm mt-2">
                  Try increasing your flight time range.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(249, 115, 22, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.6);
          }
        }
        
        .group:hover {
          animation: pulseGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}