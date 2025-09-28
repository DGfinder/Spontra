'use client'

import { useOptimistic, useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { exploreDestinationsAction, type ExploreDestinationsResult } from '@/actions/destinationActions'
import { useSearchActions, FormData } from '@/store/searchStore'
import type { DestinationRecommendation } from '@/services/apiClient'

interface OptimisticState {
  isLoading: boolean
  isError: boolean
  error: string | null
  results: DestinationRecommendation[]
  totalResults: number
  source?: 'backend' | 'amadeus' | 'fallback'
}

interface OptimisticAction {
  type: 'start' | 'success' | 'error' | 'reset'
  payload?: any
}

function optimisticReducer(state: OptimisticState, action: OptimisticAction): OptimisticState {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        isLoading: true,
        isError: false,
        error: null
      }
    case 'success':
      return {
        ...state,
        isLoading: false,
        isError: false,
        error: null,
        results: action.payload.data || [],
        totalResults: action.payload.totalResults || 0,
        source: action.payload.source
      }
    case 'error':
      return {
        ...state,
        isLoading: false,
        isError: true,
        error: action.payload.error || 'An error occurred',
        results: [],
        totalResults: 0
      }
    case 'reset':
      return {
        isLoading: false,
        isError: false,
        error: null,
        results: [],
        totalResults: 0
      }
    default:
      return state
  }
}

export function useDestinationExploreModern() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const { 
    setResults, 
    addToHistory, 
    addRecentAirport,
    addPreferredTheme,
    clearResults 
  } = useSearchActions()

  // Initial state
  const initialState: OptimisticState = {
    isLoading: false,
    isError: false,
    error: null,
    results: [],
    totalResults: 0
  }

  // Use React 19's useOptimistic for instant UI updates
  const [optimisticState, addOptimistic] = useOptimistic(
    initialState,
    optimisticReducer
  )

  // Use React 19's useActionState for Server Action handling
  const [actionState, dispatchAction, isSubmitting] = useActionState(
    async (prevState: ExploreDestinationsResult | null, formData: FormData): Promise<ExploreDestinationsResult> => {
      try {
        const result = await exploreDestinationsAction(formData)
        
        // Update Zustand store with results
        if (result.success && result.data) {
          setResults(result.data)
          
          // Add to search history
          addToHistory({
            formData,
            resultCount: result.totalResults || 0,
            searchDuration: 0 // Server Actions are typically fast
          })
          
          // Update user preferences
          addRecentAirport(formData.departureAirport)
          addPreferredTheme(formData.selectedTheme)
        }
        
        return result
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    },
    null
  )

  const exploreDestinations = async (formData: FormData) => {
    // Optimistic update - immediately show loading state
    addOptimistic({ type: 'start' })

    startTransition(async () => {
      try {
        // Dispatch the Server Action
        const result = await dispatchAction(formData)
        
        if (result.redirectTo) {
          // Handle direct flight search redirect
          router.push(result.redirectTo)
          return result
        }
        
        if (result.success && result.data) {
          // Optimistic update with success
          addOptimistic({ 
            type: 'success', 
            payload: {
              data: result.data,
              totalResults: result.totalResults,
              source: result.source
            }
          })
        } else {
          // Optimistic update with error
          addOptimistic({ 
            type: 'error', 
            payload: { error: result.error }
          })
        }
        
        return result
      } catch (error) {
        // Optimistic update with error
        const errorMessage = error instanceof Error ? error.message : 'Failed to explore destinations'
        addOptimistic({ 
          type: 'error', 
          payload: { error: errorMessage }
        })
        
        throw error
      }
    })
  }

  const retry = async (formData: FormData) => {
    console.log('Retrying destination exploration with Server Action...')
    
    // Reset error state optimistically
    addOptimistic({ type: 'reset' })
    
    try {
      await exploreDestinations(formData)
    } catch (error) {
      console.error('Retry failed:', error)
      // Error is already handled by exploreDestinations
    }
  }

  const reset = () => {
    addOptimistic({ type: 'reset' })
    clearResults()
  }

  return {
    // State from useOptimistic (instant updates)
    isLoading: optimisticState.isLoading || isPending || isSubmitting,
    isError: optimisticState.isError,
    error: optimisticState.error,
    results: optimisticState.results,
    totalResults: optimisticState.totalResults,
    source: optimisticState.source,
    
    // Actions
    exploreDestinations,
    retry,
    reset,
    clearResults,
    
    // Additional state
    isPending,
    isSubmitting,
    actionState
  }
}

// Legacy compatibility hook that wraps the modern hook
export function useDestinationExplore() {
  const modern = useDestinationExploreModern()
  
  return {
    exploreDestinations: modern.exploreDestinations,
    retry: async () => {
      // For legacy compatibility, we'd need the form data
      // This would need to be passed or retrieved from store
      console.warn('Legacy retry called - needs form data parameter')
    },
    isLoading: modern.isLoading,
    isError: modern.isError,
    error: modern.error,
    results: modern.results,
    clearResults: modern.clearResults
  }
}