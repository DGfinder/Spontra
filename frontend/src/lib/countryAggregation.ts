// Country aggregation utilities for destination results (ASCII-safe)

import { DestinationRecommendation } from '@/services/apiClient'

export interface CountryAggregation {
  country: {
    name: string
    code: string
    flag: string // use ISO code as placeholder
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
  currencySymbol?: string
  topActivities: string[]
  averageFlightTime: number
}

const COUNTRY_CONTINENTS: Record<string, string> = {
  ES: 'Europe', IT: 'Europe', FR: 'Europe', DE: 'Europe', GB: 'Europe',
  PT: 'Europe', NL: 'Europe', BE: 'Europe', AT: 'Europe', CH: 'Europe',
  GR: 'Europe', HR: 'Europe', CZ: 'Europe', HU: 'Europe', PL: 'Europe',
  DK: 'Europe', SE: 'Europe', NO: 'Europe', FI: 'Europe', IE: 'Europe',
  TR: 'Europe/Asia', EG: 'Africa', MA: 'Africa', TN: 'Africa', IL: 'Asia',
  US: 'North America', CA: 'North America', MX: 'North America',
  JP: 'Asia', CN: 'Asia', TH: 'Asia', SG: 'Asia', IN: 'Asia',
  AU: 'Oceania', NZ: 'Oceania',
  BR: 'South America', AR: 'South America', CL: 'South America', PE: 'South America', CO: 'South America'
}

function extractPrice(priceString: string | undefined): number {
  if (!priceString) return 0
  const match = priceString.match(/[\d,.]+/)
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0
}

function extractCurrencySymbol(priceString: string | undefined): string | undefined {
  if (!priceString) return undefined
  const m = priceString.match(/[€$£¥₹]/)
  return m ? m[0] : undefined
}

export function aggregateDestinationsByCountry(destinations: DestinationRecommendation[]): CountryAggregation[] {
  if (!destinations || destinations.length === 0) return []

  const groups = new Map<string, DestinationRecommendation[]>()
  destinations.forEach(d => {
    const code = d.destination.country_code
    if (!code) return
    if (!groups.has(code)) groups.set(code, [])
    groups.get(code)!.push(d)
  })

  const aggregations: CountryAggregation[] = []
  for (const [code, list] of groups.entries()) {
    const first = list[0]
    const countryName = first.destination.country_name
    const cheapest = list.reduce((min, cur) => (extractPrice(cur.estimated_flight_price) < extractPrice(min.estimated_flight_price) ? cur : min))
    const prices = list.map(l => extractPrice(l.estimated_flight_price)).filter(n => n > 0)
    if (prices.length === 0) continue
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const times = list.map(l => l.flight_route.total_duration_minutes)
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    const activities = Array.from(new Set(list.flatMap(l => l.activity_matches || []))).slice(0, 3)
    const symbol = extractCurrencySymbol(first.estimated_flight_price)

    aggregations.push({
      country: {
        name: countryName,
        code,
        flag: code, // placeholder
        continent: COUNTRY_CONTINENTS[code] || 'Unknown',
        visaFree: undefined
      },
      cheapestDestination: cheapest,
      allDestinations: list.sort((a, b) => extractPrice(a.estimated_flight_price) - extractPrice(b.estimated_flight_price)),
      destinationCount: list.length,
      priceRange: { min, max, currency: symbol || 'unknown' },
      averagePrice: avg,
      currencySymbol: symbol,
      topActivities: activities,
      averageFlightTime: avgTime
    })
  }

  return aggregations.sort((a, b) => extractPrice(a.cheapestDestination.estimated_flight_price) - extractPrice(b.cheapestDestination.estimated_flight_price))
}

export function getCountryStats(aggregations: CountryAggregation[]) {
  if (!aggregations.length) return { totalCountries: 0, totalDestinations: 0, cheapestCountry: null as any, mostExpensiveCountry: null as any, averagePrice: 0, continents: [] as string[] }
  const totalDestinations = aggregations.reduce((sum, agg) => sum + agg.destinationCount, 0)
  const allPrices = aggregations.map(agg => extractPrice(agg.cheapestDestination.estimated_flight_price)).filter(n => n > 0)
  const averagePrice = allPrices.length ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : 0
  const continents = Array.from(new Set(aggregations.map(agg => agg.country.continent))).filter(Boolean)
  return {
    totalCountries: aggregations.length,
    totalDestinations,
    cheapestCountry: aggregations[0]?.country.name,
    mostExpensiveCountry: aggregations[aggregations.length - 1]?.country.name,
    averagePrice,
    continents
  }
}

export function filterByContinent(aggregations: CountryAggregation[], continent: string): CountryAggregation[] {
  return aggregations.filter(agg => agg.country.continent === continent)
}

export function filterByPriceRange(aggregations: CountryAggregation[], minPrice: number, maxPrice: number): CountryAggregation[] {
  return aggregations.filter(agg => {
    const price = extractPrice(agg.cheapestDestination.estimated_flight_price)
    return price >= minPrice && price <= maxPrice
  })
}