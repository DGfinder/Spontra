import { useCallback } from 'react'
import { apiClient, DestinationExploreRequest, DestinationExploreResponse, ActivityType } from '@/services/apiClient'
import { useSearchStore, useSearchActions, FormData } from '@/store/searchStore'
import { destinationCache, createDestinationCacheKey, CachedDestinationSearch } from '@/lib/cache'
// Client will call our server route instead of hitting Amadeus directly

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
      // Create cache key from search parameters
      const cacheKey = createDestinationCacheKey({
        origin: formData.departureAirport,
        maxFlightTime: formData.flightTimeRange?.[1] ?? formData.maxFlightTimeRange ?? formData.maxFlightTime ?? 8,
        theme: formData.selectedTheme,
        departureDate: formData.departureDate,
        viewBy: 'PRICE'
      })

      // Check cache first
      const cachedSearch = destinationCache.get<CachedDestinationSearch>(cacheKey)
      if (cachedSearch) {
        console.log('🚀 Using cached destination results')
        
        // Create response from cached data
        const cachedResponse: DestinationExploreResponse = {
          id: `cached-${Date.now()}`,
          explore_request_id: `cache-req-${Date.now()}`,
          recommended_destinations: cachedSearch.results,
          total_results: cachedSearch.results.length,
          searched_at: cachedSearch.meta.searchTimestamp,
          processing_time_ms: 0, // Instant from cache
        }

        // Update store with cached results
        setResults(cachedResponse.recommended_destinations)
        addToHistory({
          formData,
          resultCount: cachedResponse.recommended_destinations.length,
          searchDuration: 0 // Instant from cache
        })
        
        // Track preferences
        addRecentAirport(formData.departureAirport)
        addPreferredTheme(formData.selectedTheme)
        
        setLoading(false)
        return cachedResponse
      }

      console.log('🔍 No cache hit, fetching fresh destination data')
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
        console.log('🛫 Calling server route for Amadeus destination exploration...')
        const res = await fetch('/api/amadeus/destinations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: formData.departureAirport,
            maxFlightTime,
            theme: formData.selectedTheme,
            departureDate: formData.departureDate,
          }),
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.error || 'Server route error')

        const amadeusResults = json.data

        response = {
          id: `amadeus-${Date.now()}`,
          explore_request_id: `req-${Date.now()}`,
          recommended_destinations: amadeusResults,
          total_results: amadeusResults.length,
          searched_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        }

        console.log(`✅ AMADEUS API SUCCESSFUL (server): Found ${amadeusResults.length} destinations`)
      } catch (amadeusError) {
        console.error('❌ AMADEUS API FAILED:', amadeusError)
        
        // Only attempt backend fallback if the Amadeus error doesn't indicate a fallback should be used
        const errorMessage = amadeusError instanceof Error ? amadeusError.message : String(amadeusError)
        const shouldTryBackend = process.env.NODE_ENV === 'development' && 
          process.env.NEXT_PUBLIC_API_BASE_URL && 
          !errorMessage?.includes('fallback')
        
        if (shouldTryBackend) {
          console.warn('🔄 Falling back to backend API (localhost:8081)...')
          try {
            response = await apiClient.exploreDestinations(request)
            console.log('✅ Backend API successful')
          } catch (backendError) {
            console.error('❌ Backend API also failed:', backendError)
            const backendErrorMessage = backendError instanceof Error ? backendError.message : String(backendError)
            throw new Error('Destination exploration failed: ' + (backendErrorMessage || 'Network Error'))
          }
        } else {
          console.log('🔄 No backend fallback available, throwing original error')
          throw new Error('Destination exploration failed: ' + (errorMessage || 'Service unavailable'))
        }
      }
      
      const searchDuration = Date.now() - startTime

      // Cache the successful response (24 hour TTL to match Amadeus cache refresh)
      const cacheData: CachedDestinationSearch = {
        results: response.recommended_destinations,
        searchParams: {
          origin: formData.departureAirport,
          maxFlightTime,
          theme: formData.selectedTheme,
          departureDate: formData.departureDate,
          viewBy: 'PRICE'
        },
        meta: {
          searchTimestamp: response.searched_at,
          totalResults: response.total_results,
          dataSource: 'amadeus-api'
        }
      }
      
      destinationCache.set(cacheKey, cacheData, 24) // 24 hour TTL
      console.log('💾 Cached destination search results for future requests')

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

      setLoading(false)
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