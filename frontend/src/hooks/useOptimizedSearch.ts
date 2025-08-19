import { useCallback, useMemo, useRef } from 'react'
import { useSearchForm } from './useSearchForm'
import { debounce } from '@/lib/utils'

/**
 * Optimized search hook with proper memoization and debouncing
 * Reduces unnecessary API calls and computations
 */
export function useOptimizedSearch() {
  const searchForm = useSearchForm()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Memoize expensive ETag computation
  const etagKey = useMemo(() => {
    const { formValues } = searchForm
    const [minH, maxH] = formValues.flightTimeRange || [1, formValues.maxFlightTime || 8]
    const slot = Math.floor(Date.now() / (2 * 60 * 1000))
    
    return `${formValues.departureAirport}|${formValues.departureDate}|${formValues.directFlightsOnly ? '1' : '0'}|${Math.round(minH*2)/2}|${Math.round(maxH*2)/2}|${slot}`
  }, [
    searchForm.formValues.departureAirport,
    searchForm.formValues.departureDate, 
    searchForm.formValues.directFlightsOnly,
    searchForm.formValues.flightTimeRange,
    searchForm.formValues.maxFlightTime
  ])

  // Optimized destination count fetcher with proper cleanup
  const fetchDestinationCount = useCallback(async (
    origin: string,
    minFlightTime: number,
    maxFlightTime: number,
    departureDate: string,
    nonStop: boolean
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch('/api/amadeus/destinations/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          minFlightTime,
          maxFlightTime,
          departureDate,
          nonStop
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null // Request was cancelled
      }
      throw error
    }
  }, [])

  // Debounced version of fetch function
  const debouncedFetchDestinationCount = useMemo(
    () => debounce(fetchDestinationCount, 250),
    [fetchDestinationCount]
  )

  // Memoized form validation
  const isFormValid = useMemo(() => {
    const { formValues } = searchForm
    return !!(
      formValues.departureAirport &&
      formValues.departureDate &&
      formValues.selectedTheme
    )
  }, [
    searchForm.formValues.departureAirport,
    searchForm.formValues.departureDate,
    searchForm.formValues.selectedTheme
  ])

  // Optimized submit handler
  const handleOptimizedSubmit = useCallback(async (data: any) => {
    if (!isFormValid) return
    
    try {
      // Cleanup any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Submit logic here
      console.log('Submitting optimized form:', data)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }, [isFormValid])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    ...searchForm,
    etagKey,
    fetchDestinationCount: debouncedFetchDestinationCount,
    handleOptimizedSubmit,
    isFormValid,
    cleanup
  }
}