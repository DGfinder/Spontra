'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { useDestinationExplore } from '@/hooks/useDestinationExplore'
import { useFormData, useSearchState, useSearchActions, useNavigationState, useNavigationActions } from '@/store/searchStore'
import { DestinationRecommendation } from '@/services/apiClient'
import { getThemeColor, getThemeGradient, type ThemeKey } from '@/lib/theme'
import { useUserAuth } from '@/contexts/UserAuthContext'

interface FormData {
  selectedTheme: string
  departureAirport: string
  destinationAirport?: string
  destinationAirportDetailed?: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime?: number // Made optional for backward compatibility
  flightTimeRange?: [number, number]
  minFlightTime?: number
  maxFlightTimeRange?: number
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
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
    id: 'indulge', 
    label: 'Indulge', 
    background: '/indulge-background.jpg',
    color: 'indulge'
  },
  { 
    id: 'vibe', 
    label: 'Vibe', 
    background: '/vibe-background.jpg',
    color: 'vibe'
  },
  { 
    id: 'discover', 
    label: 'Discover', 
    background: '/discover-background.jpg',
    color: 'discover'
  }
]

const BLURBS: Record<ThemeKey, { title: string; description: string }> = {
  adventure: {
    title: 'Thrilling Adventures Await',
    description:
      'From mountain treks to hidden canyons, uncover destinations packed with adrenaline and breathtaking views. Find trips that match your sense of adventure.'
  },
  nature: {
    title: 'Reconnect With Nature',
    description:
      'Seek out serene forests, coastal escapes, and national parks. We\'ll help you find peaceful places immersed in greenery and fresh air.'
  },
  indulge: {
    title: 'Indulge in Luxury & Wellness',
    description:
      'Luxury shopping, spa retreats, and premium experiences. Discover destinations where you can pamper yourself and enjoy the finer things.'
  },
  vibe: {
    title: 'Feel The Social Energy',
    description:
      'Find cities with buzzing bars, festivals, and vibrant social scenes. Plan a getaway where the energy and connections are unforgettable.'
  },
  discover: {
    title: 'Discover Culture & Cuisine',
    description:
      'Museums, local markets, and authentic culinary experiences. Explore places that inspire curiosity and expand your cultural horizons.'
  }
}

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
  
  // Use the destination explore hook and router
  const { exploreDestinations, retry } = useDestinationExplore()
  const router = useRouter()
  
  // Get user authentication state
  const { user, isAuthenticated, logout } = useUserAuth()

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
      // DIRECT SEARCH MODE: Both airports specified
      if (data.destinationAirport && data.departureAirport && data.destinationAirport !== data.departureAirport) {
        console.log(`🛫 Direct flight search: ${data.departureAirport} → ${data.destinationAirport}`)
        
        const params = new URLSearchParams({
          origin: data.departureAirport,
          destination: data.destinationAirport,
          departureDate: data.departureDate,
          passengers: data.passengers.toString(),
          ...(data.returnDate && data.tripType === 'return' && { returnDate: data.returnDate }),
          ...(data.cabinClass && { cabinClass: data.cabinClass })
        })
        
        // Navigate to direct flight search page
        router.push(`/flights?${params.toString()}`)
        return
      }

      // THEME-BASED EXPLORATION MODE (existing flow)
      console.log(`🌍 Exploring destinations within ${data.maxFlightTime} hours from ${data.departureAirport}`)
      
      // Call the API to explore destinations
      const response = await exploreDestinations(data)
      
      console.log(`Found ${response.recommended_destinations.length} destinations for ${data.selectedTheme} theme`)
      
      // Results are automatically set by the hook via store
      // Navigate to results step
      navigateToStep('results')
    } catch (error) {
      console.error('Destination exploration failed:', error)
      
      // Show honest error, no fake data
      const errorInfo = getErrorMessage(error, 'Destination search')
      console.error('Error - no fallback available:', errorInfo.userMessage)
      // Re-throw to let the UI handle the error state
      throw new Error(errorInfo.userMessage)
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

  const handleRetrySearch = () => {
    if (formData) {
      handleSubmit(formData)
    }
  }

  return (
    <div 
      className="h-screen w-full relative overflow-hidden"
      style={{ height: '100vh', width: '100vw' }}
    >
      {/* Crossfading background layers — one per theme, opacity transition */}
      {THEMES.map(theme => (
        <div
          key={theme.id}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url('${theme.background}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            opacity: currentTheme.id === theme.id ? 1 : 0,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0,
          }}
        />
      ))}
      {/* Network Status Monitor */}
      <NetworkStatus onRetry={handleRetrySearch} />
      {/* Header - Mobile Responsive */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 md:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-white font-muli">
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide">SPONTRA</span>
            <span className="mx-1 sm:mx-2 text-base sm:text-lg md:text-xl text-white/60">|</span>
            <span className="text-base sm:text-lg md:text-xl font-normal tracking-wide">EXPLORE</span>
          </div>
          <div className="text-white/80 text-xs sm:text-sm hover:text-white font-muli transition-colors duration-200">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <span>Hi, {user?.firstName || user?.username || 'User'}</span>
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-semibold">
                    {(user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/auth/profile" 
                    className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/admin/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />

      {/* Layout - show search panel only on the initial Search step */}
      {navigation.currentStep === 'search' && (
      <div className="absolute inset-0 left-[2vw] z-20 grid grid-cols-1 md:grid-cols-[460px_1fr] lg:grid-cols-[500px_1fr] xl:grid-cols-[520px_1fr] items-start pt-20 sm:pt-24 md:pt-28">
        {/* Form Panel with Overlay - Responsive */}
        <div className="relative flex w-full p-4 md:p-5">
          <div className="flex w-full flex-col justify-start pt-1 pb-6 md:pb-8 ml-2">
            <SearchFormErrorBoundary>
              <SearchForm
                themes={THEMES}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </SearchFormErrorBoundary>
          </div>
        </div>
        {/* Emphasized Blurb - floats over hero for better visibility */}
        <div
          className="hidden md:flex"
          style={{ position: 'relative' }}
        >
          <div
            className="absolute top-16 md:top-20 lg:top-28 w-[min(560px,44vw)] bg-black/55 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 lg:p-7 shadow-2xl"
            style={{ right: '5vw' }}
          >
            <div className="text-white font-muli">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="inline-block h-1.5 w-8 rounded"
                  aria-hidden="true"
                  style={{ background: getThemeGradient(formData.selectedTheme as ThemeKey) }}
                ></span>
                <h3 className="font-extrabold tracking-tight text-xl md:text-2xl">
                  {BLURBS[formData.selectedTheme as ThemeKey]?.title || 'Discover Amazing Destinations'}
                </h3>
              </div>
              <p className="opacity-90 text-sm md:text-base leading-relaxed">
                {BLURBS[formData.selectedTheme as ThemeKey]?.description || 'Find your perfect getaway based on your interests and travel style. From adventure-packed destinations to cultural experiences, we’ll help you discover places that match your mood.'}
              </p>
            </div>
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