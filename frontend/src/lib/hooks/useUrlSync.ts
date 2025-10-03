import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSearchStore, SearchFilters } from '@/lib/store'

/**
 * Syncs Zustand search store with URL parameters for shareable links
 *
 * URL format: /?from=LAX&theme=adventure&minFlight=2&maxFlight=8&passengers=2&cabin=Business&departure=2025-11-10&return=2025-11-17&tripType=round-trip&direct=true
 */
export function useUrlSync() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { filters, updateFilter } = useSearchStore()
  const isInitialMount = useRef(true)

  // On mount: Load filters from URL
  useEffect(() => {
    if (!isInitialMount.current) return

    const urlFrom = searchParams.get('from')
    const urlTheme = searchParams.get('theme')
    const urlMinFlight = searchParams.get('minFlight')
    const urlMaxFlight = searchParams.get('maxFlight')
    const urlPassengers = searchParams.get('passengers')
    const urlCabin = searchParams.get('cabin')
    const urlDeparture = searchParams.get('departure')
    const urlReturn = searchParams.get('return')
    const urlTripType = searchParams.get('tripType')
    const urlDirect = searchParams.get('direct')

    // Apply URL params to store (only if they exist)
    if (urlFrom) updateFilter('departureAirport', urlFrom.toUpperCase())
    if (urlTheme) updateFilter('theme', urlTheme)
    if (urlMinFlight) updateFilter('minFlightTime', parseInt(urlMinFlight, 10))
    if (urlMaxFlight) updateFilter('maxFlightTime', parseInt(urlMaxFlight, 10))
    if (urlPassengers) updateFilter('passengers', parseInt(urlPassengers, 10))
    if (urlCabin) updateFilter('cabin', urlCabin)
    if (urlDeparture) updateFilter('departureDate', urlDeparture)
    if (urlReturn) updateFilter('returnDate', urlReturn)
    if (urlTripType && (urlTripType === 'round-trip' || urlTripType === 'one-way')) {
      updateFilter('tripType', urlTripType)
    }
    if (urlDirect) updateFilter('onlyDirect', urlDirect === 'true')

    isInitialMount.current = false
  }, [searchParams, updateFilter])

  // On filter change: Update URL (skip on initial mount)
  useEffect(() => {
    if (isInitialMount.current) return

    const params = new URLSearchParams()

    // Add filters to URL (only non-default values)
    if (filters.departureAirport) params.set('from', filters.departureAirport)
    if (filters.theme) params.set('theme', filters.theme)
    if (filters.minFlightTime !== 2) params.set('minFlight', filters.minFlightTime.toString())
    if (filters.maxFlightTime !== 8) params.set('maxFlight', filters.maxFlightTime.toString())
    if (filters.passengers !== 1) params.set('passengers', filters.passengers.toString())
    if (filters.cabin !== 'Economy') params.set('cabin', filters.cabin)
    if (filters.departureDate) params.set('departure', filters.departureDate)
    if (filters.returnDate) params.set('return', filters.returnDate)
    if (filters.tripType !== 'round-trip') params.set('tripType', filters.tripType)
    if (filters.onlyDirect) params.set('direct', 'true')

    // Update URL without causing navigation/reload
    const newUrl = params.toString() ? `/?${params.toString()}` : '/'
    router.replace(newUrl, { scroll: false })
  }, [filters, router])

  return null
}
