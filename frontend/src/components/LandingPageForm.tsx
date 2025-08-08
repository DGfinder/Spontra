'use client'

import { useEffect } from 'react'
import { SearchForm } from './SearchForm'
import { SearchResults } from './SearchResults'
import { CountryConstellation } from './CountryConstellation'
import { CitySelection } from './CitySelection'
import { ActivityConstellation } from './ActivityConstellation'
import { FlightResults } from './FlightResults'
import { BookingConfirmation } from './BookingConfirmation'
import { BreadcrumbNavigation } from './BreadcrumbNavigation'
import { useDestinationExplore } from '@/hooks/useDestinationExplore'
import { useFormData, useSearchState, useSearchActions, useNavigationState, useNavigationActions } from '@/store/searchStore'
import { DestinationRecommendation } from '@/services/apiClient'

interface FormData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime?: number // Made optional for backward compatibility
  flightTimeRange?: [number, number]
  minFlightTime?: number
  maxFlightTimeRange?: number
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
    background: '/adventure-background.jpg',
    color: 'adventure'
  },
  { 
    id: 'nature', 
    label: 'Nature', 
    background: '/nature-background.jpg',
    color: 'nature'
  },
  { 
    id: 'shopping', 
    label: 'Shopping', 
    background: '/shopping-background.jpg',
    color: 'shopping'
  },
  { 
    id: 'party', 
    label: 'Party', 
    background: '/party-background.jpg',
    color: 'party'
  },
  { 
    id: 'learn', 
    label: 'Learn', 
    background: '/learn-background.jpg',
    color: 'learn'
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
  // Get state from Zustand store
  const formData = useFormData()
  const { isLoading, isError, error, results, showResults } = useSearchState()
  const navigation = useNavigationState()
  const { updateFormData, setShowResults, clearResults, setResults } = useSearchActions()
  const { 
    navigateToStep, 
    navigateBack, 
    setSelectedDestination, 
    setSelectedCity, 
    setSelectedActivity, 
    setSelectedFlight 
  } = useNavigationActions()
  
  // Use the destination explore hook
  const { exploreDestinations, retry } = useDestinationExplore()

  const currentTheme = THEMES.find(t => t.id === formData.selectedTheme) || THEMES[0]

  // Preload background images for smooth transitions
  useEffect(() => {
    THEMES.forEach(theme => {
      const img = new Image()
      img.src = theme.background
    })
  }, [])

  const handleSubmit = async (data: FormData) => {
    try {
      console.log(`Searching destinations within ${data.maxFlightTime} hours from ${data.departureAirport}`)
      
      // Call the API to explore destinations
      const response = await exploreDestinations(data)
      
      console.log(`Found ${response.recommended_destinations.length} destinations for ${data.selectedTheme} theme`)
      
      // Results are automatically set by the hook via store
      // Navigate to results step
      navigateToStep('results')
    } catch (error) {
      console.error('Destination exploration failed:', error)
      
      // Fallback to mock data on API failure
      console.log('Falling back to mock data...')
      // Get max flight time from range or fallback
      const maxFlightTime = data.flightTimeRange?.[1] ?? data.maxFlightTimeRange ?? data.maxFlightTime ?? 8
      
      const filteredCountries = MOCK_COUNTRIES.filter(
        country => country.averageFlightTime <= maxFlightTime
      )
      
      // Convert mock data to API format for consistency  
      const mockResults: DestinationRecommendation[] = filteredCountries.map(country => ({
        destination: {
          id: country.code,
          airport_code: country.code,
          city_name: country.cities[0] || country.name,
          country_name: country.name,
          country_code: country.code,
          description: country.description,
          image_url: '',
          activities: [],
          popularity_score: 75,
          climate_info: {
            average_temperature: '15-25°C',
            rainy_months: [],
            sunny_months: [],
            climate_type: 'Temperate'
          },
          best_time_to_visit: [],
          budget: {
            level: 'mid-range',
            daily_budget_range: country.priceRange,
            currency: 'EUR'
          },
          timezone: 'Europe/London',
          language: ['English'],
          currency: 'EUR',
          visa_required: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        flight_route: {
          id: `${data.departureAirport}-${country.code}`,
          origin_airport_code: data.departureAirport,
          destination_airport_code: country.code,
          estimated_duration_hours: Math.floor(country.averageFlightTime),
          estimated_duration_minutes: Math.round((country.averageFlightTime % 1) * 60),
          total_duration_minutes: country.averageFlightTime * 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        match_score: 85,
        activity_matches: [data.selectedTheme] as any,
        reason_for_recommendation: `Perfect for ${data.selectedTheme} activities`,
        estimated_flight_price: country.priceRange
      }))
      
      // Update store with mock results to maintain consistent state
      setResults(mockResults)
      setShowResults(true)
      console.log(`Mock fallback successful: ${mockResults.length} destinations loaded`)
      
      // Navigate to results step
      navigateToStep('results')
    }
  }
  
  const handleBackToSearch = () => {
    setShowResults(false)
    clearResults()
    navigateToStep('search')
  }

  const handleExploreDestination = (destination: DestinationRecommendation) => {
    console.log('Exploring destination:', destination.destination.city_name)
    // Jump straight to flights to show real options; avoids mock city layer
    setSelectedDestination(destination)
    navigateToStep('flights')
  }

  const handleCitySelect = (city: any) => {
    setSelectedCity(city)
    // Create destination object compatible with ActivityConstellation
    const destinationForActivity: DestinationRecommendation = {
      destination: {
        id: city.id || city.airport_code,
        airport_code: city.airport_code,
        city_name: city.name,
        country_name: navigation.selectedDestination?.destination.country_name || 'Unknown',
        country_code: navigation.selectedDestination?.destination.country_code || 'ES',
        description: city.description || 'Beautiful destination',
        image_url: '',
        activities: [],
        popularity_score: 75,
        climate_info: {
          average_temperature: '15-25°C',
          rainy_months: [],
          sunny_months: [],
          climate_type: 'Temperate'
        },
        best_time_to_visit: [],
        budget: {
          level: 'mid-range',
          daily_budget_range: city.estimated_price || '€200-400',
          currency: 'EUR'
        },
        timezone: 'Europe/Madrid',
        language: ['English', 'Spanish'],
        currency: 'EUR',
        visa_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      flight_route: {
        id: `${formData.departureAirport}-${city.airport_code}`,
        origin_airport_code: formData.departureAirport,
        destination_airport_code: city.airport_code,
        estimated_duration_hours: Math.floor(city.flight_duration),
        estimated_duration_minutes: Math.round((city.flight_duration % 1) * 60),
        total_duration_minutes: city.flight_duration * 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      match_score: 90,
      activity_matches: [formData.selectedTheme] as any,
      reason_for_recommendation: `Perfect for ${formData.selectedTheme} activities`,
      estimated_flight_price: city.estimated_price || '€250'
    }
    setSelectedDestination(destinationForActivity)
    navigateToStep('activities')
  }

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity)
    navigateToStep('flights')
  }

  const handleFlightSelect = (flight: any) => {
    setSelectedFlight(flight)
    navigateToStep('booking')
  }

  const handleBackToResults = () => {
    navigateBack()
  }

  const handleViewCountryConstellation = () => {
    navigateToStep('countries')
  }

  const handleCountryExplore = (destination: DestinationRecommendation) => {
    console.log('Exploring country:', destination.destination.country_name)
    setSelectedDestination(destination)
    navigateToStep('cities')
  }

  const handleStartNewSearch = () => {
    // Reset all navigation and search state
    clearResults()
    setShowResults(false)
    navigateToStep('search')
    setSelectedDestination(null)
    setSelectedCity(null)
    setSelectedActivity(null)
    setSelectedFlight(null)
  }

  return (
    <div 
      className="h-screen w-full bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ 
        backgroundImage: `url('${currentTheme.background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        height: '100vh',
        width: '100vw'
      }}
    >
      {/* Header - Mobile Responsive */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 md:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-white font-muli">
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide">SPONTRA</span>
            <span className="mx-1 sm:mx-2 text-base sm:text-lg md:text-xl text-white/60">|</span>
            <span className="text-base sm:text-lg md:text-xl font-normal tracking-wide">EXPLORE</span>
          </div>
          <div className="text-white/80 text-xs sm:text-sm hover:text-white cursor-pointer font-muli transition-colors duration-200">
            Sign In
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />

      {/* Layout - show search panel only on the initial Search step */}
      {navigation.currentStep === 'search' && (
      <div className="absolute inset-0 z-20 flex flex-col lg:flex-row pt-24 sm:pt-28 md:pt-32">
        {/* Form Panel with Overlay - Responsive */}
        <div 
          className="relative p-4 md:p-5 w-full lg:w-[370px] xl:w-[400px] h-full overflow-y-auto"
          style={{ 
            maxHeight: 'calc(100vh - 6rem)' 
          }}
        >
          {/* Form Panel Overlay */}
          <div 
            className="absolute inset-0 z-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.702)' }}
          />
          <div className="relative z-10">
            <SearchForm
              themes={THEMES}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Details Panel - Responsive visibility and sizing */}
        <div 
          className="hidden lg:flex lg:flex-col bg-transparent"
          style={{ 
            width: '369px',
            padding: '20px'
          }}
        >
          <div className="text-white font-muli">
            <h3 className="font-bold mb-4 text-lg xl:text-xl">
              Discover Amazing Destinations
            </h3>
            <p className="opacity-80 text-sm xl:text-base leading-relaxed">
              Find your perfect getaway based on your interests and travel style. 
              From adventure-packed destinations to cultural experiences, 
              we'll help you discover places that match your mood.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Navigation-based Rendering */}
      {navigation.currentStep === 'results' && showResults && (
        <SearchResults
          results={results}
          isLoading={isLoading}
          isError={isError}
          error={error}
          maxFlightTime={formData.maxFlightTime}
          departureAirport={formData.departureAirport}
          selectedTheme={formData.selectedTheme}
          onBackToSearch={handleBackToSearch}
          onRetry={retry}
          onExploreDestination={handleExploreDestination}
        />
      )}

      {navigation.currentStep === 'countries' && results.length > 0 && (
        <CountryConstellation
          originAirport={formData.departureAirport}
          recommendations={results}
          onCountryClick={handleCountryExplore}
        />
      )}

      {navigation.currentStep === 'cities' && navigation.selectedDestination && (
        <CitySelection
          country={{
            name: navigation.selectedDestination.destination.country_name,
            region: 'Europe' // TODO: Get from country data
          }}
          originAirport={formData.departureAirport}
          selectedTheme={formData.selectedTheme}
          onBack={handleBackToResults}
          onCitySelect={handleCitySelect}
        />
      )}

      {navigation.currentStep === 'activities' && navigation.selectedDestination && (
        <ActivityConstellation
          recommendation={navigation.selectedDestination}
          originAirport={formData.departureAirport}
          onBack={handleBackToResults}
          onActivitySelect={handleActivitySelect}
          onBookFlight={() => navigateToStep('flights')}
        />
      )}

      {navigation.currentStep === 'flights' && navigation.selectedDestination && (
        <FlightResults
          recommendation={navigation.selectedDestination}
          originAirport={formData.departureAirport}
          selectedActivity={navigation.selectedActivity?.category}
          onBack={handleBackToResults}
          onFlightSelect={handleFlightSelect}
        />
      )}

      {navigation.currentStep === 'booking' && navigation.selectedDestination && navigation.selectedFlight && (
        <BookingConfirmation
          destination={navigation.selectedDestination}
          flight={navigation.selectedFlight}
          activity={navigation.selectedActivity}
          originAirport={formData.departureAirport}
          onStartNewSearch={handleStartNewSearch}
        />
      )}

      {/* Legacy Search Results Overlay - Show when not using navigation flow */}
      {false && showResults && navigation.currentStep === 'search' && (
        <SearchResults
          results={results}
          isLoading={isLoading}
          isError={isError}
          error={error}
          maxFlightTime={formData.maxFlightTime}
          departureAirport={formData.departureAirport}
          selectedTheme={formData.selectedTheme}
          onBackToSearch={handleBackToSearch}
          onRetry={retry}
          onExploreDestination={handleExploreDestination}
        />
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