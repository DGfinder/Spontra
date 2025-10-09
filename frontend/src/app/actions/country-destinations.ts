'use server'

import { db } from '@/lib/db'
import { getCachedFlightOffers } from '@/lib/cache'

interface SearchContext {
  originAirport: string
  theme: string
  minFlightTime: number // hours
  maxFlightTime: number // hours
  departureDate: string
  returnDate: string
  passengers: number
}

interface FilteredDestination {
  id: string
  cityName: string
  slug: string | null
  airportCode: string | null
  imageUrl: string | null
  description: string | null
  popularityScore: number | null
  flightDuration?: number
  priceEstimate?: string
  cheapestPrice?: number
  currency?: string
  themePOIs: Array<{
    theme: string
  }>
  airports: Array<{
    airportCode: string
    isPrimary: boolean
  }>
}

/**
 * Get destinations for a country filtered by search context
 */
export async function getFilteredCountryDestinations(
  countryCode: string,
  searchContext?: SearchContext
): Promise<FilteredDestination[]> {
  try {
    // If no search context, return all destinations for the country (fallback)
    if (!searchContext) {
      const destinations = await db.destination.findMany({
        where: {
          country: {
            code: countryCode.toUpperCase()
          }
        },
        include: {
          themePOIs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { theme: true }
          },
          airports: {
            orderBy: { isPrimary: 'desc' },
            select: {
              airportCode: true,
              isPrimary: true
            }
          }
        },
        orderBy: {
          popularityScore: 'desc'
        }
      })

      return destinations as FilteredDestination[]
    }

    // Convert hours to minutes for flight route filtering
    const minMinutes = searchContext.minFlightTime * 60
    const maxMinutes = searchContext.maxFlightTime * 60
    const origin = searchContext.originAirport.toUpperCase().trim()

    console.log('[Country Destinations] Filtering:', {
      countryCode,
      origin,
      theme: searchContext.theme,
      flightTimeRange: `${searchContext.minFlightTime}h-${searchContext.maxFlightTime}h`
    })

    // Step 1: Get flight routes within the time range from this origin
    const validRoutes = await db.flightRoute.findMany({
      where: {
        originAirportCode: origin,
        totalDurationMinutes: {
          gte: minMinutes,
          lte: maxMinutes
        }
      }
    })

    if (validRoutes.length === 0) {
      console.log('[Country Destinations] No routes found in time range')
      return []
    }

    const destinationCodes = validRoutes.map(route => route.destinationAirportCode)

    // Step 2: Get destinations for this country with matching routes and theme
    type DestinationWithAirport = {
      destination_id: string
      city_name: string
      slug: string | null
      country_id: string | null
      description: string | null
      popularity_score: string | null
      image_url: string | null
      airport_code: string
      airport_name: string
      is_primary: boolean
      is_searchable: boolean
    }

    const destinationsWithAirports = await db.$queryRaw<DestinationWithAirport[]>`
      SELECT DISTINCT ON (d.id)
        d.id as destination_id,
        d.city_name,
        d.slug,
        d.country_id,
        d.description,
        d.popularity_score,
        d.image_url,
        da.airport_code,
        a.name as airport_name,
        da.is_primary,
        a.is_searchable
      FROM destinations d
      INNER JOIN destination_airports da ON d.id = da.destination_id
      INNER JOIN airports a ON da.airport_code = a.iata_code
      INNER JOIN countries c ON d.country_id = c.id
      WHERE a.is_searchable = true
        AND c.code = ${countryCode.toUpperCase()}
        AND da.airport_code = ANY(${destinationCodes})
        AND EXISTS (
          SELECT 1 FROM theme_pois tp
          WHERE tp.destination_id = d.id
          AND tp.theme = ${searchContext.theme}
        )
      ORDER BY d.id, da.is_primary DESC, da.airport_code ASC
    `

    console.log('[Country Destinations] Found', destinationsWithAirports.length, 'matching destinations')

    if (destinationsWithAirports.length === 0) {
      return []
    }

    // Fetch theme POIs
    const destinationIds = destinationsWithAirports.map(d => d.destination_id)
    const themePOIs = await db.themePOI.findMany({
      where: {
        destinationId: { in: destinationIds },
        theme: searchContext.theme
      },
      orderBy: { displayOrder: 'asc' },
      select: { destinationId: true, theme: true }
    })

    // Group POIs by destination
    const poisByDest = new Map<string, typeof themePOIs>()
    for (const poi of themePOIs) {
      if (!poisByDest.has(poi.destinationId)) {
        poisByDest.set(poi.destinationId, [])
      }
      poisByDest.get(poi.destinationId)!.push(poi)
    }

    // Step 3: Get real flight data for pricing
    const flightDataPromises = destinationsWithAirports.map(async (dest) => {
      try {
        const airportCode = dest.airport_code

        const { offers } = await getCachedFlightOffers({
          origin,
          destination: airportCode,
          departureDate: searchContext.departureDate,
          adults: searchContext.passengers || 1
        })

        if (offers.data.length === 0) {
          return null
        }

        // Find cheapest offer
        const cheapest = offers.data.reduce((min, offer) => {
          const currentPrice = parseFloat(offer.price.total)
          const minPrice = parseFloat(min.price.total)
          return currentPrice < minPrice ? offer : min
        })

        // Calculate actual flight duration
        const totalMinutes = cheapest.itineraries.reduce((sum, itinerary) => {
          const match = itinerary.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
          if (!match) return sum
          const hours = match[1] ? parseInt(match[1]) : 0
          const minutes = match[2] ? parseInt(match[2]) : 0
          return sum + (hours * 60) + minutes
        }, 0)

        return {
          id: dest.destination_id,
          cityName: dest.city_name,
          slug: dest.slug,
          airportCode: airportCode,
          imageUrl: dest.image_url,
          description: dest.description,
          popularityScore: dest.popularity_score ? parseFloat(dest.popularity_score) : null,
          flightDuration: Math.round(totalMinutes / 60),
          priceEstimate: `From ${cheapest.price.currency} $${cheapest.price.total}`,
          cheapestPrice: parseFloat(cheapest.price.total),
          currency: cheapest.price.currency,
          themePOIs: poisByDest.get(dest.destination_id) || [],
          airports: [{
            airportCode: dest.airport_code,
            isPrimary: dest.is_primary
          }]
        }
      } catch (error) {
        console.error(`[Country Destinations] Failed to get flights for ${dest.airport_code}:`, error)
        // Return destination without flight data
        return {
          id: dest.destination_id,
          cityName: dest.city_name,
          slug: dest.slug,
          airportCode: dest.airport_code,
          imageUrl: dest.image_url,
          description: dest.description,
          popularityScore: dest.popularity_score ? parseFloat(dest.popularity_score) : null,
          themePOIs: poisByDest.get(dest.destination_id) || [],
          airports: [{
            airportCode: dest.airport_code,
            isPrimary: dest.is_primary
          }]
        }
      }
    })

    const flightDataResults = await Promise.all(flightDataPromises)

    // Filter out nulls and sort by price (or popularity if no price)
    const destinations = flightDataResults
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => {
        // Sort by price if available, otherwise by popularity
        if (a.cheapestPrice && b.cheapestPrice) {
          return a.cheapestPrice - b.cheapestPrice
        }
        return (b.popularityScore || 0) - (a.popularityScore || 0)
      })

    console.log('[Country Destinations] Returning', destinations.length, 'destinations with flight data')

    return destinations
  } catch (error) {
    console.error('[Country Destinations] Error:', error)
    throw error
  }
}
