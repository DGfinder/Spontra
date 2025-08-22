import { useCallback } from 'react'
import { DestinationExploreResponse, DestinationRecommendation } from '@/services/apiClient'
import { useSearchStore, useSearchActions, FormData } from '@/store/searchStore'
import { destinationCache, createDestinationCacheKey, CachedDestinationSearch } from '@/lib/cacheClient'
// Client will call our server route instead of hitting Amadeus directly


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
      // Extract flight time range for cache key
      const minFlightTime = formData.flightTimeRange?.[0] ?? formData.minFlightTime ?? 0.5
      const maxFlightTime = formData.flightTimeRange?.[1] ?? formData.maxFlightTimeRange ?? formData.maxFlightTime ?? 8

      // Create cache key from search parameters
      const cacheKey = createDestinationCacheKey({
        origin: formData.departureAirport,
        maxFlightTime,
        theme: formData.selectedTheme,
        departureDate: formData.departureDate
      })

      // Check cache first
      const cachedSearch = destinationCache.get<CachedDestinationSearch>(cacheKey)
      if (cachedSearch) {
        console.log('🚀 Using cached destination results')
        
        // Create response from cached data
        const cachedResponse: DestinationExploreResponse = {
          id: `cached-${Date.now()}`,
          explore_request_id: `cache-req-${Date.now()}`,
          recommended_destinations: cachedSearch.results as DestinationRecommendation[],
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
      
      console.log('Exploring destinations with parameters:', {
        origin: formData.departureAirport,
        minFlightTime,
        maxFlightTime,
        theme: formData.selectedTheme,
        departureDate: formData.departureDate,
        nonStop: !!formData.directFlightsOnly,
      })

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
            minFlightTime,
            maxFlightTime,
            theme: formData.selectedTheme,
            departureDate: formData.departureDate,
            nonStop: !!formData.directFlightsOnly,
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
        const errorMessage = amadeusError instanceof Error ? amadeusError.message : String(amadeusError)
        throw new Error('Destination exploration failed: ' + (errorMessage || 'Service unavailable'))
      }
      
      const searchDuration = Date.now() - startTime

      // Cache the successful response (24 hour TTL to match Amadeus cache refresh)
      const cacheData: CachedDestinationSearch = {
        results: response.recommended_destinations,
        searchParams: {
          origin: formData.departureAirport,
          maxFlightTime,
          theme: formData.selectedTheme,
          departureDate: formData.departureDate
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