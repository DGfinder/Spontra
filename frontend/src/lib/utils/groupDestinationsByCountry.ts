import { Destination } from '@/lib/store'
import { CountryGroup } from '@/types/country'
import { getCountryImageClient } from './getCountryImage'

/**
 * Groups destinations by country and calculates aggregate metrics
 * Used client-side after receiving search results
 */
export function groupDestinationsByCountry(
  destinations: Destination[],
  theme: string
): CountryGroup[] {
  // Group destinations by country code
  const countryMap = new Map<string, Destination[]>()

  destinations.forEach((destination) => {
    const code = destination.country.code
    if (!countryMap.has(code)) {
      countryMap.set(code, [])
    }
    countryMap.get(code)!.push(destination)
  })

  // Transform into CountryGroup array with aggregated data
  const countryGroups: CountryGroup[] = Array.from(countryMap.entries()).map(
    ([code, dests]) => {
      // Calculate shortest flight time (in hours)
      const shortestFlightTime =
        Math.min(
          ...dests
            .map((d) => d.flightDuration)
            .filter((duration): duration is number => duration !== undefined)
        ) || 0

      // Calculate cheapest price
      const prices = dests
        .map((d) => {
          if (!d.priceEstimate) return null
          // Extract number from "From USD $123.45" format
          const match = d.priceEstimate.match(/\$?([\d,.]+)/)
          return match ? parseFloat(match[1].replace(',', '')) : null
        })
        .filter((p): p is number => p !== null)

      const cheapestPrice = prices.length > 0 ? Math.min(...prices) : 0

      // Get currency from first destination with price
      const destWithPrice = dests.find((d) => d.priceEstimate)
      const currency = destWithPrice?.priceEstimate?.match(/([A-Z]{3})/)?.[1] || 'USD'

      // Get country info from first destination
      const firstDest = dests[0]

      // Resolve image
      const imageResolution = getCountryImageClient(
        code,
        // Note: destinations from API don't have country.imageUrl yet
        // This will be added when we update the API to include it
        null
      )

      return {
        countryCode: code,
        countryName: firstDest.country.name,
        imageUrl: imageResolution.url,
        imageType: imageResolution.type,
        shortestFlightTime,
        cheapestPrice,
        currency,
        destinationCount: dests.length,
        destinations: dests
      }
    }
  )

  // Sort by cheapest price (ascending)
  return countryGroups.sort((a, b) => a.cheapestPrice - b.cheapestPrice)
}

/**
 * Filter and sort country groups
 */
export function filterCountryGroups(
  groups: CountryGroup[],
  filters: {
    maxPrice?: number
    maxFlightTime?: number
    sortBy?: 'price' | 'flightTime' | 'destinations'
  }
): CountryGroup[] {
  let filtered = [...groups]

  // Apply filters
  if (filters.maxPrice) {
    filtered = filtered.filter((g) => g.cheapestPrice <= filters.maxPrice!)
  }

  if (filters.maxFlightTime) {
    filtered = filtered.filter((g) => g.shortestFlightTime <= filters.maxFlightTime!)
  }

  // Apply sorting
  switch (filters.sortBy) {
    case 'price':
      filtered.sort((a, b) => a.cheapestPrice - b.cheapestPrice)
      break
    case 'flightTime':
      filtered.sort((a, b) => a.shortestFlightTime - b.shortestFlightTime)
      break
    case 'destinations':
      filtered.sort((a, b) => b.destinationCount - a.destinationCount)
      break
    default:
      // Keep existing order (price ascending by default)
      break
  }

  return filtered
}
