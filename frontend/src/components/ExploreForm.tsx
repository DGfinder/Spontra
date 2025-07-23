'use client'

import { useState } from 'react'
import { CountryConstellation } from './CountryConstellation'
import { CitySelection } from './CitySelection'
import { ActivityConstellation } from './ActivityConstellation'
import { FlightResults } from './FlightResults'
import { ExplorationProgress } from './ExplorationProgress'

interface ExploreFormData {
  origin: string
  minFlightDuration: number
  maxFlightDuration: number
  preferredActivities: ActivityType[]
  budgetLevel: string
  maxResults: number
  includeVisaRequired: boolean
}

type ActivityType = 'activities' | 'shopping' | 'restaurants' | 'nature' | 'culture' | 'nightlife' | 'beaches' | 'sightseeing' | 'adventure' | 'relaxation'

const ACTIVITY_OPTIONS: { value: ActivityType; label: string; icon: string; hasBackground?: boolean }[] = [
  { value: 'activities', label: 'Activities', icon: '🎯' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️', hasBackground: true },
  { value: 'restaurants', label: 'Restaurants', icon: '🍽️' },
  { value: 'nature', label: 'Nature', icon: '🌲' },
  { value: 'culture', label: 'Culture', icon: '🎭', hasBackground: true },
  { value: 'nightlife', label: 'Nightlife', icon: '🌃', hasBackground: true },
  { value: 'beaches', label: 'Beaches', icon: '🏖️' },
  { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️', hasBackground: true },
  { value: 'adventure', label: 'Adventure', icon: '🏔️', hasBackground: true },
  { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
]

export function ExploreForm() {
  const [formData, setFormData] = useState<ExploreFormData>({
    origin: '',
    minFlightDuration: 1,
    maxFlightDuration: 4,
    preferredActivities: [],
    budgetLevel: 'any',
    maxResults: 20,
    includeVisaRequired: false
  })

  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null)
  const [selectedCity, setSelectedCity] = useState<any | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<any | null>(null)
  const [showFlightResults, setShowFlightResults] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  // Dynamic background based on selected activities
  const getBackgroundImage = () => {
    if (formData.preferredActivities.length === 0) {
      return '/nature-background.jpg' // Default to the nature image
    }
    
    // Priority order for background selection - matches LandingPageForm themes
    if (formData.preferredActivities.includes('shopping')) {
      return '/shopping-background.jpg'
    }
    if (formData.preferredActivities.includes('culture') || formData.preferredActivities.includes('sightseeing')) {
      return '/learn-background.jpg'
    }
    if (formData.preferredActivities.includes('nightlife')) {
      return '/party-background.jpg'
    }
    if (formData.preferredActivities.includes('adventure')) {
      return '/adventure-background.jpg'
    }
    if (formData.preferredActivities.includes('nature') || formData.preferredActivities.includes('beaches') || formData.preferredActivities.includes('relaxation')) {
      return '/nature-background.jpg'
    }
    
    // Fallback to nature image
    return '/nature-background.jpg'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check if backend services are available
      const searchServiceUrl = process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || process.env.SEARCH_SERVICE_URL
      
      if (!searchServiceUrl) {
        // Mock data for demonstration when backend is not available
        console.log('Backend service not configured, showing mock destinations')
        setRecommendations([
          {
            destination: {
              country_name: "France",
              city_name: "Paris",
              airport_code: "CDG"
            },
            flight_route: {
              total_duration_minutes: 240
            },
            estimated_flight_price: 450,
            match_score: 0.95
          },
          {
            destination: {
              country_name: "Italy",
              city_name: "Rome",
              airport_code: "FCO"
            },
            flight_route: {
              total_duration_minutes: 180
            },
            estimated_flight_price: 380,
            match_score: 0.88
          },
          {
            destination: {
              country_name: "Spain",
              city_name: "Barcelona",
              airport_code: "BCN"
            },
            flight_route: {
              total_duration_minutes: 150
            },
            estimated_flight_price: 320,
            match_score: 0.82
          }
        ])
        setIsLoading(false)
        return
      }

      const response = await fetch(`${searchServiceUrl}/api/v1/explore/destinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin_airport_code: formData.origin,
          min_flight_duration_hours: formData.minFlightDuration,
          max_flight_duration_hours: formData.maxFlightDuration,
          preferred_activities: formData.preferredActivities,
          budget_level: formData.budgetLevel,
          max_results: formData.maxResults,
          include_visa_required: formData.includeVisaRequired,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommended_destinations || [])
    } catch (error) {
      console.error('Error getting recommendations:', error)
      // Show mock data as fallback
      setRecommendations([
        {
          destination: {
            country_name: "Portugal",
            city_name: "Lisbon",
            airport_code: "LIS"
          },
          flight_route: {
            total_duration_minutes: 120
          },
          estimated_flight_price: 280,
          match_score: 0.85
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ExploreFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleActivityToggle = (activity: ActivityType) => {
    setFormData(prev => ({
      ...prev,
      preferredActivities: prev.preferredActivities.includes(activity)
        ? prev.preferredActivities.filter(a => a !== activity)
        : [...prev.preferredActivities, activity]
    }))
  }

  const handleCountrySelect = (recommendation: any) => {
    setSelectedCountry(recommendation)
  }

  const handleCitySelect = (city: any) => {
    setSelectedCity(city)
    // Create a destination object for compatibility with existing flow
    setSelectedDestination({
      destination: {
        city_name: city.name,
        country_name: selectedCountry?.destination?.country_name || 'Unknown',
        airport_code: city.airport_code
      },
      flight_route: {
        total_duration_minutes: city.flight_duration * 60
      },
      estimated_flight_price: city.estimated_price,
      match_score: 0.9
    })
  }

  const handleBackToSearch = () => {
    setSelectedCountry(null)
    setSelectedCity(null)
    setSelectedDestination(null)
    setShowFlightResults(false)
    setSelectedActivity(null)
  }

  const handleBackToCountries = () => {
    setSelectedCountry(null)
    setSelectedCity(null)
    setSelectedDestination(null)
    setShowFlightResults(false)
    setSelectedActivity(null)
  }

  const handleBackToCities = () => {
    setSelectedCity(null)
    setSelectedDestination(null)
    setShowFlightResults(false)
    setSelectedActivity(null)
  }

  const handleBookFlight = (recommendation: any) => {
    setShowFlightResults(true)
  }

  const handleBackToActivities = () => {
    setShowFlightResults(false)
  }

  const handleFlightSelect = (flight: any) => {
    console.log('Selected flight:', flight)
    // TODO: Proceed to final booking flow
  }

  // If showing flight results, render FlightResults
  if (selectedDestination && showFlightResults) {
    return (
      <FlightResults
        recommendation={selectedDestination}
        originAirport={formData.origin}
        selectedActivity={selectedActivity || undefined}
        onBack={handleBackToActivities}
        onFlightSelect={handleFlightSelect}
      />
    )
  }

  // If a destination is selected, show the activity constellation
  if (selectedDestination) {
    return (
      <ActivityConstellation
        recommendation={selectedDestination}
        originAirport={formData.origin}
        onBack={handleBackToCities}
        onActivitySelect={(activity) => {
          setSelectedActivity(activity.category)
          console.log('Selected activity:', activity.name)
          // TODO: Add to itinerary or proceed to booking
        }}
        onBookFlight={handleBookFlight}
      />
    )
  }

  // If a country is selected, show city selection
  if (selectedCountry) {
    return (
      <CitySelection
        country={{
          name: selectedCountry.destination.country_name,
          region: 'Europe' // TODO: Get from country data
        }}
        originAirport={formData.origin}
        selectedTheme={formData.preferredActivities[0] || undefined}
        onBack={handleBackToCountries}
        onCitySelect={handleCitySelect}
      />
    )
  }

  return (
    <div 
      className="relative min-h-screen bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: `url('${getBackgroundImage()}')`,
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Progress Indicator */}
      <ExplorationProgress 
        currentStep={
          selectedDestination ? 'activities' :
          selectedCountry ? 'cities' :
          recommendations.length > 0 ? 'countries' : 'search'
        }
        destination={
          selectedDestination ? {
            city_name: selectedDestination.destination.city_name,
            country_name: selectedDestination.destination.country_name
          } :
          selectedCountry ? {
            city_name: 'Cities',
            country_name: selectedCountry.destination.country_name
          } : undefined
        }
      />
      
      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Compact Form Panel */}
        <div className="w-80 bg-black/70 backdrop-blur-sm p-6 text-white">
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-1">WHERE ARE YOU LOOKING TO GO?</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Activities Section */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">
                Activities
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITY_OPTIONS.slice(0, 6).map((activity) => (
                  <button
                    key={activity.value}
                    type="button"
                    onClick={() => handleActivityToggle(activity.value)}
                    className={`p-2 rounded text-xs transition-all duration-200 ${
                      formData.preferredActivities.includes(activity.value)
                        ? 'bg-white text-black'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-sm mb-1">{activity.icon}</div>
                      <div className="text-xs">{activity.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Flight Range */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">
                FLIGHT RANGE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    placeholder="From"
                    value={formData.minFlightDuration}
                    onChange={(e) => handleInputChange('minFlightDuration', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white/20 text-white placeholder-white/60 rounded text-sm border border-white/30 focus:border-white focus:ring-1 focus:ring-white"
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="To"
                    value={formData.maxFlightDuration}
                    onChange={(e) => handleInputChange('maxFlightDuration', parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 bg-white/20 text-white placeholder-white/60 rounded text-sm border border-white/30 focus:border-white focus:ring-1 focus:ring-white"
                    min="1"
                    max="12"
                  />
                </div>
              </div>
              <div className="text-xs text-white/70 mt-1">Hours</div>
            </div>

            {/* From Airport */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">
                FROM
              </label>
              <input
                type="text"
                placeholder="Airport code (e.g., LHR)"
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-white/20 text-white placeholder-white/60 rounded text-sm border border-white/30 focus:border-white focus:ring-1 focus:ring-white"
                maxLength={3}
                required
              />
            </div>

            {/* To Airport - Disabled to show "Anywhere" */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">
                TO
              </label>
              <input
                type="text"
                value="Anywhere"
                disabled
                className="w-full px-3 py-2 bg-white/10 text-white/60 rounded text-sm border border-white/20"
              />
            </div>

            {/* Search Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!formData.origin || isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white font-medium py-3 px-4 rounded text-sm transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SEARCHING...
                  </>
                ) : (
                  'SEARCH FLIGHTS'
                )}
              </button>
            </div>
          </form>

          {/* Results Summary in Form Panel */}
          {recommendations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <h3 className="text-sm font-medium text-white mb-2">
                FOUND {recommendations.length} DESTINATIONS
              </h3>
              <p className="text-xs text-white/70">
                Explore the constellation →
              </p>
            </div>
          )}
        </div>

        {/* Right Side - Constellation or Background Showcase */}
        <div className="flex-1 relative">
          {recommendations.length > 0 ? (
            /* Country Constellation View */
            <CountryConstellation
              originAirport={formData.origin}
              recommendations={recommendations}
              onCountryClick={handleCountrySelect}
            />
          ) : (
            /* Background Attribution when no results */
            <div className="flex items-end justify-end p-8 h-full">
              <div className="text-white/60 text-xs bg-black/30 px-3 py-1 rounded">
                {formData.preferredActivities.length === 0 ? 'Nature & Relaxation' : 
                 formData.preferredActivities.includes('shopping') ? 'Shopping Districts' :
                 formData.preferredActivities.includes('culture') || formData.preferredActivities.includes('sightseeing') ? 'Cultural Experiences' :
                 formData.preferredActivities.includes('nightlife') ? 'Nightlife Scene' :
                 formData.preferredActivities.includes('adventure') ? 'Adventure Awaits' :
                 formData.preferredActivities.includes('nature') || formData.preferredActivities.includes('beaches') || formData.preferredActivities.includes('relaxation') ? 'Nature & Serenity' :
                 'Explore More'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}