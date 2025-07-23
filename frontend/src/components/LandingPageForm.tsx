'use client'

import { useEffect } from 'react'
import { SearchForm } from './SearchForm'
import { SearchResults } from './SearchResults'
import { useDestinationExplore } from '@/hooks/useDestinationExplore'
import { useFormData, useSearchState, useSearchActions } from '@/store/searchStore'
import { DestinationRecommendation } from '@/services/apiClient'

interface FormData {
  selectedTheme: string
  departureAirport: string
  departureDate: string
  returnDate?: string
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
    id: 'nature', 
    label: 'Nature', 
    icon: '🌿',
    background: '/nature-background.jpg',
    color: 'green'
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
  // Get state from Zustand store
  const formData = useFormData()
  const { isLoading, isError, error, results, showResults } = useSearchState()
  const { updateFormData, setShowResults, clearResults } = useSearchActions()
  
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
    } catch (error) {
      console.error('Destination exploration failed:', error)
      
      // Fallback to mock data on API failure
      console.log('Falling back to mock data...')
      const filteredCountries = MOCK_COUNTRIES.filter(
        country => country.averageFlightTime <= data.maxFlightTime
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
      
      // Fallback would need to use store actions too
      // For now, let the error state handle this
    }
  }
  
  const handleBackToSearch = () => {
    setShowResults(false)
    clearResults()
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
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-main.png" 
              alt="Logo" 
              className="h-8 md:h-10 w-auto"
            />
            <img 
              src="/logo-text.png" 
              alt="Explore" 
              className="h-6 md:h-8 w-auto"
            />
          </div>
          <div className="text-white/80 text-xs md:text-sm hover:text-white cursor-pointer font-muli">
            Sign In
          </div>
        </div>
      </div>

      {/* Layout - Desktop: Two Panels, Mobile: Single Panel */}
      <div className="absolute inset-0 z-20 flex flex-col lg:flex-row" style={{ top: '60px' }}>
        {/* Form Panel with Overlay */}
        <div 
          className="relative p-4 md:p-6 w-full lg:w-[370px] lg:p-5"
          style={{ 
            maxWidth: '100vw'
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

        {/* Details Panel - Hidden on mobile/tablet, visible on large screens */}
        <div 
          className="hidden lg:block bg-transparent"
          style={{ 
            width: '369px',
            padding: '20px'
          }}
        >
          <div className="text-white font-muli">
            <h3 className="font-bold mb-4" style={{ fontSize: '18px' }}>
              Discover Amazing Destinations
            </h3>
            <p className="opacity-80" style={{ fontSize: '12px', lineHeight: '1.637' }}>
              Find your perfect getaway based on your interests and travel style. 
              From adventure-packed destinations to cultural experiences, 
              we'll help you discover places that match your mood.
            </p>
          </div>
        </div>
      </div>

      {/* Search Results Overlay */}
      {showResults && (
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
          onExploreDestination={(destination) => {
            console.log('Exploring destination:', destination.destination.city_name)
            // TODO: Navigate to destination details or booking
          }}
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