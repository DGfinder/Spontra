'use client'

import { useState, useCallback } from 'react'
import { useSearchStore } from '@/lib/searchState'
import type { DestinationRecommendation } from '@/lib/searchState'

interface SearchOptions {
  origin?: string
  theme?: string
  minFlightTime?: number
  maxFlightTime?: number
}

export function useDestinationSearch() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { setSearching, setResults, setError: setStoreError } = useSearchStore()

  const searchDestinations = useCallback(async (options: SearchOptions) => {
    setIsLoading(true)
    setError(null)
    setSearching(true)
    setStoreError(null)

    try {
      const response = await fetch('/api/destinations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed')
      }

      const recommendations: DestinationRecommendation[] = data.destinations || []
      setResults(recommendations)
      return recommendations

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setStoreError(errorMessage)
      console.error('Destination search error:', err)
      return []
    } finally {
      setIsLoading(false)
      setSearching(false)
    }
  }, [setSearching, setResults, setStoreError])

  const getPopularDestinations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/destinations/popular')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch popular destinations: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch popular destinations')
      }

      return data.destinations || []

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Popular destinations error:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    searchDestinations,
    getPopularDestinations,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}

// Alias for compatibility with existing code
export const useDestinationExploreModern = useDestinationSearch