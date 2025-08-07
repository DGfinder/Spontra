import { useCallback } from 'react'
import { apiClient, DestinationExploreRequest, DestinationExploreResponse, ActivityType } from '@/services/apiClient'
import { useSearchStore, useSearchActions, FormData } from '@/store/searchStore'
import { amadeusService } from '@/services/amadeusService'

// Theme to activity mapping
const THEME_TO_ACTIVITY: Record<string, ActivityType> = {
  adventure: 'adventure',
  nature: 'nature',
  shopping: 'shopping',
  party: 'nightlife',
  learn: 'culture',
  // Legacy mappings for compatibility
  activities: 'activities'
}

export function useDestinationExplore() {
  const { isLoading, isError, error, results } = useSearchStore()
  const { 
    setLoading, 
    setError, 
    setResults, 
    addToHistory, 
    addRecentAirport,
    addPreferredTheme 
  } = useSearchActions()

  const exploreDestinations = useCallback(async (formData: FormData) => {
    // Validate required fields
    if (!formData.departureAirport) {
      throw new Error('Departure airport is required')
    }

    setLoading(true)
    setError(null)

    try {
      // Extract flight time range from form data
      const minFlightTime = formData.flightTimeRange?.[0] ?? formData.minFlightTime ?? 0.5
      const maxFlightTime = formData.flightTimeRange?.[1] ?? formData.maxFlightTimeRange ?? formData.maxFlightTime ?? 8

      // Map form data to API request
      const request: DestinationExploreRequest = {
        origin_airport_code: formData.departureAirport,
        min_flight_duration_hours: minFlightTime,
        max_flight_duration_hours: maxFlightTime,
        preferred_activities: [THEME_TO_ACTIVITY[formData.selectedTheme] || 'adventure'],
        budget_level: 'any',
        max_results: 20,
        include_visa_required: false
      }

      console.log('Exploring destinations with parameters:', request)

      // Try Amadeus service first (direct API access with your credentials)
      const startTime = Date.now()
      let response: DestinationExploreResponse
      
      try {
        console.log('🛫 ATTEMPTING AMADEUS API for destination exploration...')
        console.log('📋 Amadeus parameters:', {
          origin: formData.departureAirport,
          maxFlightTime: maxFlightTime,
          theme: formData.selectedTheme,
          departureDate: formData.departureDate
        })
        
        const amadeusResults = await amadeusService.exploreDestinations({
          origin: formData.departureAirport,
          maxFlightTime: maxFlightTime,
          theme: formData.selectedTheme,
          departureDate: formData.departureDate
        })
        
        // Convert to expected response format
        response = {
          id: `amadeus-${Date.now()}`,
          explore_request_id: `req-${Date.now()}`,
          recommended_destinations: amadeusResults,
          total_results: amadeusResults.length,
          searched_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
        
        console.log(`✅ AMADEUS API SUCCESSFUL: Found ${amadeusResults.length} real destinations!`)
        console.log('📊 First result sample:', amadeusResults[0]?.destination?.city_name)
      } catch (amadeusError) {
        console.error('❌ AMADEUS API FAILED:', amadeusError)
        console.warn('🔄 Falling back to backend API (localhost:8081)...')
        try {
          response = await apiClient.exploreDestinations(request)
          console.log('✅ Backend API successful')
        } catch (backendError) {
          console.error('❌ Backend API also failed:', backendError)
          throw backendError  // This will trigger the existing fallback in LandingPageForm
        }
      }
      
      const searchDuration = Date.now() - startTime

      // Update store with results
      setResults(response.recommended_destinations)

      // Add to search history
      addToHistory({
        formData,
        resultCount: response.recommended_destinations.length,
        searchDuration
      })

      // Update user preferences
      addRecentAirport(formData.departureAirport)
      addPreferredTheme(formData.selectedTheme)

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to explore destinations'
      
      setLoading(false)
      setError(errorMessage)

      throw error
    }
  }, [setLoading, setError, setResults, addToHistory, addRecentAirport, addPreferredTheme])

  const { clearResults } = useSearchActions()

  const retry = useCallback(async () => {
    // Get the current form data for retry
    const { formData } = useSearchStore.getState()
    
    if (!formData.departureAirport) {
      console.error('Cannot retry: No departure airport in form data')
      return
    }

    console.log('Retrying destination exploration with stored parameters...')
    
    try {
      // Clear any existing error state
      setError(null)
      
      // Retry the search with current form data
      await exploreDestinations(formData)
    } catch (error) {
      console.error('Retry failed:', error)
      // Error is already handled by exploreDestinations
    }
  }, [exploreDestinations, setError])

  return {
    exploreDestinations,
    clearResults,
    retry,
    isLoading,
    isError,
    error,
    results
  }
}