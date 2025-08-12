// Country aggregation utilities for destination results
// Groups destinations by country and finds best deals per country

import { DestinationRecommendation } from '@/services/apiClient'
import { useSearchStore } from '@/store/searchStore'

export interface CountryAggregation {
  country: {
    name: string
    code: string
    flag: string // Flag emoji or URL
    continent: string
    visaFree?: boolean
  }
  cheapestDestination: DestinationRecommendation
  allDestinations: DestinationRecommendation[]
  destinationCount: number
  priceRange: {
    min: number
    max: number
    currency: string
  }
  averagePrice: number
  topActivities: string[]
  averageFlightTime: number
}

// Country flag mapping (using emoji flags for fast loading)
const COUNTRY_FLAGS: Record<string, string> = {
  'ES': '🇪🇸', 'IT': '🇮🇹', 'FR': '🇫🇷', 'DE': '🇩🇪', 'GB': '🇬🇧',
  'PT': '🇵🇹', 'NL': '🇳🇱', 'BE': '🇧🇪', 'AT': '🇦🇹', 'CH': '🇨🇭',
  'GR': '🇬🇷', 'HR': '🇭🇷', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'PL': '🇵🇱',
  'DK': '🇩🇰', 'SE': '🇸🇪', 'NO': '🇳🇴', 'FI': '🇫🇮', 'IE': '🇮🇪',
  'TR': '🇹🇷', 'EG': '🇪🇬', 'MA': '🇲🇦', 'TN': '🇹🇳', 'IL': '🇮🇱',
  'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽', 'JP': '🇯🇵', 'CN': '🇨🇳',
  'TH': '🇹🇭', 'SG': '🇸🇬', 'AU': '🇦🇺', 'NZ': '🇳🇿', 'BR': '🇧🇷',
  'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪', 'CO': '🇨🇴', 'IN': '🇮🇳'
}

// Continent mapping for better organization
const COUNTRY_CONTINENTS: Record<string, string> = {
  'ES': 'Europe', 'IT': 'Europe', 'FR': 'Europe', 'DE': 'Europe', 'GB': 'Europe',
  'PT': 'Europe', 'NL': 'Europe', 'BE': 'Europe', 'AT': 'Europe', 'CH': 'Europe',
  'GR': 'Europe', 'HR': 'Europe', 'CZ': 'Europe', 'HU': 'Europe', 'PL': 'Europe',
  'DK': 'Europe', 'SE': 'Europe', 'NO': 'Europe', 'FI': 'Europe', 'IE': 'Europe',
  'TR': 'Europe/Asia', 'EG': 'Africa', 'MA': 'Africa', 'TN': 'Africa', 'IL': 'Asia',
  'US': 'North America', 'CA': 'North America', 'MX': 'North America',
  'JP': 'Asia', 'CN': 'Asia', 'TH': 'Asia', 'SG': 'Asia', 'IN': 'Asia',
  'AU': 'Oceania', 'NZ': 'Oceania',
  'BR': 'South America', 'AR': 'South America', 'CL': 'South America', 
  'PE': 'South America', 'CO': 'South America'
}

// Simplified visa-free map (placeholder for production data source)
// Keyed by passport country code -> set of destination country codes
const VISA_FREE: Record<string, Set<string>> = {
  // Example: Spanish passport
  'ES': new Set(['DE','NL','FR','IT','PT','GB','BE','AT','CH','GR','HR','CZ','HU','PL','DK','SE','NO','FI','IE','TR','MA','TN','US','CA','MX','JP','TH','SG','AU','NZ']),
  // Add more as needed
}

function isVisaFree(passport: string, destination: string): boolean {
  const set = VISA_FREE[passport?.toUpperCase?.() || '']
  return set ? set.has(destination?.toUpperCase?.()) : false
}

/**
 * Extract price from estimated_flight_price string
 */
function extractPrice(priceString: string | undefined): number {
  if (!priceString) return 0
  // Extract numbers from strings like "€206.1", "€150-300", "$250"
  const match = priceString.match(/[\d,.]+/)
  return match ? parseFloat(match[0].replace(',', '')) : 0
}

/**
 * Aggregate destinations by country, showing cheapest per country
 */
export function aggregateDestinationsByCountry(
  destinations: DestinationRecommendation[]
): CountryAggregation[] {
  if (!destinations || destinations.length === 0) {
    return []
  }

  console.log('🌍 Aggregating', destinations.length, 'destinations by country')

  // Group destinations by country code
  const countryGroups = new Map<string, DestinationRecommendation[]>()

  destinations.forEach(destination => {
    const countryCode = destination.destination.country_code
    const countryName = destination.destination.country_name

    if (!countryCode || !countryName) {
      console.warn('Missing country info for destination:', destination.destination.id)
      return
    }

    if (!countryGroups.has(countryCode)) {
      countryGroups.set(countryCode, [])
    }
    countryGroups.get(countryCode)!.push(destination)
  })

  // Create country aggregations
  const aggregations: CountryAggregation[] = []

  const countryEntries = Array.from(countryGroups.entries())
  for (const [countryCode, countryDestinations] of countryEntries) {
    const firstDestination = countryDestinations[0]
    const countryName = firstDestination.destination.country_name

    // Find cheapest destination in this country
    const cheapestDestination = countryDestinations.reduce((cheapest, current) => {
      const cheapestPrice = extractPrice(cheapest.estimated_flight_price)
      const currentPrice = extractPrice(current.estimated_flight_price)
      return currentPrice < cheapestPrice && currentPrice > 0 ? current : cheapest
    })

    // Calculate price range
    const prices = countryDestinations
      .map(d => extractPrice(d.estimated_flight_price))
      .filter(price => price > 0)

    if (prices.length === 0) {
      console.warn('No valid prices found for country:', countryName)
      continue
    }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)

    // Calculate average flight time
    const flightTimes = countryDestinations.map(d => d.flight_route.total_duration_minutes)
    const averageFlightTime = Math.round(flightTimes.reduce((sum, time) => sum + time, 0) / flightTimes.length)

    // Extract top activities (simplified - could be enhanced with actual activity data)
    const topActivities = Array.from(new Set(
      countryDestinations.flatMap(d => d.activity_matches || [])
    )).slice(0, 3)

    const passport = typeof window !== 'undefined' ? useSearchStore.getState().preferences.passportCountryCode : ''
    const visaFree = passport ? isVisaFree(passport, countryCode) : undefined

    const aggregation: CountryAggregation = {
      country: {
        name: countryName,
        code: countryCode,
        flag: COUNTRY_FLAGS[countryCode] || '🌍',
        continent: COUNTRY_CONTINENTS[countryCode] || 'Unknown',
        visaFree
      },
      cheapestDestination,
      allDestinations: countryDestinations.sort((a, b) => {
        const priceA = extractPrice(a.estimated_flight_price)
        const priceB = extractPrice(b.estimated_flight_price)
        return priceA - priceB
      }),
      destinationCount: countryDestinations.length,
      priceRange: {
        min: minPrice,
        max: maxPrice,
        currency: 'EUR' // Could extract from price strings
      },
      averagePrice,
      topActivities,
      averageFlightTime
    }

    aggregations.push(aggregation)
  }

  // Sort countries by cheapest price
  const sortedAggregations = aggregations.sort((a, b) => {
    const priceA = extractPrice(a.cheapestDestination.estimated_flight_price)
    const priceB = extractPrice(b.cheapestDestination.estimated_flight_price)
    return priceA - priceB
  })

  console.log('✅ Created country aggregations for', sortedAggregations.length, 'countries')
  return sortedAggregations
}

/**
 * Get country summary statistics
 */
export function getCountryStats(aggregations: CountryAggregation[]) {
  if (!aggregations.length) {
    return {
      totalCountries: 0,
      totalDestinations: 0,
      cheapestCountry: null,
      mostExpensiveCountry: null,
      averagePrice: 0,
      continents: []
    }
  }

  const totalDestinations = aggregations.reduce((sum, agg) => sum + agg.destinationCount, 0)
  const allPrices = aggregations.map(agg => extractPrice(agg.cheapestDestination.estimated_flight_price))
  const averagePrice = Math.round(allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length)

  const continents = Array.from(new Set(aggregations.map(agg => agg.country.continent)))
    .filter(continent => continent && continent !== 'Unknown')

  return {
    totalCountries: aggregations.length,
    totalDestinations,
    cheapestCountry: aggregations[0]?.country.name,
    mostExpensiveCountry: aggregations[aggregations.length - 1]?.country.name,
    averagePrice,
    continents
  }
}

/**
 * Filter country aggregations by continent
 */
export function filterByContinent(
  aggregations: CountryAggregation[], 
  continent: string
): CountryAggregation[] {
  return aggregations.filter(agg => agg.country.continent === continent)
}

/**
 * Filter country aggregations by price range
 */
export function filterByPriceRange(
  aggregations: CountryAggregation[],
  minPrice: number,
  maxPrice: number
): CountryAggregation[] {
  return aggregations.filter(agg => {
    const price = extractPrice(agg.cheapestDestination.estimated_flight_price)
    return price >= minPrice && price <= maxPrice
  })
}