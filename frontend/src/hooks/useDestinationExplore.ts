import { useCallback } from 'react'
import { apiClient, DestinationExploreRequest, DestinationExploreResponse, ActivityType } from '@/services/apiClient'
import { useSearchStore, useSearchActions, FormData } from '@/store/searchStore'

// Theme to activity mapping
const THEME_TO_ACTIVITY: Record<string, ActivityType> = {
  adventure: 'adventure',
  activities: 'activities',
  shopping: 'shopping',
  party: 'nightlife',
  learn: 'culture'
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
      // Map form data to API request
      const request: DestinationExploreRequest = {
        origin_airport_code: formData.departureAirport,
        min_flight_duration_hours: 0, // Always start from 0
        max_flight_duration_hours: formData.maxFlightTime,
        preferred_activities: [THEME_TO_ACTIVITY[formData.selectedTheme] || 'adventure'],
        budget_level: 'any',
        max_results: 20,
        include_visa_required: false
      }

      console.log('Exploring destinations with parameters:', request)

      // Call API
      const startTime = Date.now()
      const response = await apiClient.exploreDestinations(request)
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
    // For retry, we need the last search parameters
    // This could be stored in the store or passed as a parameter
    console.log('Retry functionality would need last search parameters')
  }, [])

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