'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/environment'
import { SearchForm } from './SearchForm'
import { SearchResults } from './SearchResults'
import { CountryConstellation } from './CountryConstellation'
import { CitySelection } from './CitySelection'
import { ActivityConstellation } from './ActivityConstellation'
import { FlightResults } from './FlightResults'
import { BookingConfirmation } from './BookingConfirmation'
import { BreadcrumbNavigation } from './BreadcrumbNavigation'
import { SearchFormErrorBoundary, FlightResultsErrorBoundary, BookingFlowErrorBoundary } from './ErrorBoundary'
import { NetworkStatus } from './NetworkStatus'
import { LandingLayoutServer } from './server/LandingLayoutServer'
import { THEMES_DATA } from './server/ThemeBackgroundServer'
import { useDestinationExploreModern } from '@/hooks/useDestinationSearch'
import { useFormData, useSearchState, useNavigationState, useNavigationActions, type DestinationRecommendation } from '@/lib/searchState'
import { type ThemeKey } from '@/lib/theme'

interface FormData {
  selectedTheme: string
  departureAirport: string
  destinationAirport?: string
  destinationAirportDetailed?: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime?: number
  flightTimeRange?: [number, number]
  minFlightTime?: number
  maxFlightTimeRange?: number
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  directFlightsOnly?: boolean
}

interface LandingPageFormModernProps {
  initialData?: {
    popularDestinations?: any[]
  } | null
}

// Themes are now imported from Server Component

// Loading fallback component for Suspense
function SearchFormSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        <div className="h-8 bg-white/20 rounded-lg"></div>
        <div className="h-12 bg-white/20 rounded-lg"></div>
        <div className="h-12 bg-white/20 rounded-lg"></div>
        <div className="h-10 bg-white/20 rounded-lg"></div>
      </div>
    </div>
  )
}

export function LandingPageFormModern({ initialData }: LandingPageFormModernProps = {}) {
  // Get state from Zustand store
  const formData = useFormData()
  const { showResults } = useSearchState()
  const navigation = useNavigationState()
  const { 
    navigateToStep, 
    navigateBack, 
    setSelectedDestination, 
    setSelectedCity, 
    setSelectedActivity, 
    setSelectedFlight 
  } = useNavigationActions()
  
  // Use the modern React 19 hook with Server Actions
  const { 
    exploreDestinations, 
    retry, 
    reset,
    isLoading, 
    isError, 
    error, 
    results,
    totalResults,
    source,
    isPending,
    isSubmitting 
  } = useDestinationExploreModern()
  
  const router = useRouter()

  const currentTheme = THEMES_DATA.find(t => t.id === formData.selectedTheme) || THEMES_DATA[0]

  // Preload background images for smooth transitions (now handled by Server Component)
  useEffect(() => {
    // Background preloading is now handled by ThemeBackgroundServer
  }, [])

  const handleSubmit = async (data: FormData) => {
    try {
      console.log(`🚀 Modern form submission with Server Actions`)
      
      // Call the modern hook which uses Server Actions
      const result = await exploreDestinations(data)
      
      if (result?.redirectTo) {
        // Direct flight search - navigate immediately
        router.push(result.redirectTo)
        return
      }
      
      if (result?.success) {
        console.log(`Found ${result.totalResults} destinations for ${data.selectedTheme} theme`)
        // Navigation is handled by the Server Action result
        navigateToStep('results')
      }
    } catch (error) {
      console.error('Modern destination exploration failed:', error)
      
      // Show honest error, no fake data
      const errorInfo = getErrorMessage(error, 'Destination search')
      console.error('Error - no fallback available:', errorInfo.userMessage)
      // Error state is already handled by useOptimistic in the hook
    }
  }
  
  const handleBackToSearch = () => {
    reset()
    navigateToStep('search')
  }

  const handleExploreDestination = (destination: DestinationRecommendation) => {
    console.log('Exploring destination:', destination.destination.city_name)
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
    reset()
    navigateToStep('search')
    setSelectedDestination(null)
    setSelectedCity(null)
    setSelectedActivity(null)
    setSelectedFlight(null)
  }

  const handleRetrySearch = async () => {
    if (formData) {
      await retry(formData)
    }
  }

  return (
    <LandingLayoutServer
      selectedTheme={formData.selectedTheme}
      currentTheme={currentTheme}
      isPending={isPending}
      isSubmitting={isSubmitting}
    >
      {/* Network Status Monitor */}
      <NetworkStatus onRetry={handleRetrySearch} />
      
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />

      {/* Layout - show search panel only on the initial Search step */}
      {navigation.currentStep === 'search' && (
      <div className="absolute inset-0 left-[3vw] z-20 grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr] xl:grid-cols-[450px_1fr] items-start pt-20 sm:pt-24 md:pt-28">
        {/* Form Panel with Overlay - Responsive */}
        <div className="relative flex w-full p-4 md:p-5">
          <div className="flex w-full flex-col justify-start pt-1 pb-6 md:pb-8 ml-2">
            <SearchFormErrorBoundary>
              <Suspense fallback={<SearchFormSkeleton />}>
                <SearchForm
                  themes={THEMES_DATA}
                  onSubmit={handleSubmit}
                  isLoading={isLoading || isPending || isSubmitting}
                />
              </Suspense>
            </SearchFormErrorBoundary>
          </div>
        </div>
        
        {/* Theme blurb is now handled by ThemeBlurbServer */}
      </div>
      )}

      {/* Navigation-based Rendering */}
      {navigation.currentStep === 'results' && showResults && (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-2 border-white/30 border-t-white rounded-full"></div></div>}>
          <SearchResults
            results={results}
            isLoading={isLoading}
            isError={isError}
            error={error}
            maxFlightTime={formData.maxFlightTime}
            departureAirport={formData.departureAirport}
            selectedTheme={formData.selectedTheme}
            onBackToSearch={handleBackToSearch}
            onRetry={handleRetrySearch}
            onExploreDestination={handleExploreDestination}
          />
        </Suspense>
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
          themeKey={formData.selectedTheme as ThemeKey}
          onBack={handleBackToResults}
          onActivitySelect={handleActivitySelect}
          onBookFlight={() => navigateToStep('flights')}
        />
      )}

      {navigation.currentStep === 'flights' && navigation.selectedDestination && (
        <FlightResultsErrorBoundary>
          <FlightResults
            recommendation={navigation.selectedDestination}
            originAirport={formData.departureAirport}
            selectedActivity={navigation.selectedActivity?.category}
            onBack={handleBackToResults}
            onFlightSelect={handleFlightSelect}
          />
        </FlightResultsErrorBoundary>
      )}

      {navigation.currentStep === 'booking' && navigation.selectedDestination && navigation.selectedFlight && (
        <BookingFlowErrorBoundary>
          <BookingConfirmation
            destination={navigation.selectedDestination}
            flight={navigation.selectedFlight}
            activity={navigation.selectedActivity}
            originAirport={formData.departureAirport}
            onStartNewSearch={handleStartNewSearch}
          />
        </BookingFlowErrorBoundary>
      )}
    </LandingLayoutServer>
  )
}