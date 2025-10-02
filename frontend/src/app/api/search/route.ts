import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCachedFlightOffers } from '@/lib/cache'
import { formatDuration } from '@/lib/amadeus'

interface SearchRequest {
  departureAirport: string
  theme: string
  minFlightTime: number
  maxFlightTime: number
}

interface DestinationResponse {
  id: string
  cityName: string
  countryName: string
  airportCode: string
  description?: string | null
  flightDuration?: number
  priceEstimate?: string
  cheapestPrice?: number
  currency?: string
  offersCount?: number
}

interface SearchResponse {
  success: boolean
  destinations: DestinationResponse[]
  count: number
  cacheMetrics?: {
    avgHitTime: number
    cacheHits: number
    cacheMisses: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const body: SearchRequest = await request.json()
    const { departureAirport, theme, minFlightTime, maxFlightTime } = body

    // Validate required fields
    if (!departureAirport || !theme) {
      return NextResponse.json({
        success: false,
        destinations: [],
        count: 0,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Normalize and validate airport code
    const origin = departureAirport.toUpperCase().trim()
    if (origin.length !== 3) {
      return NextResponse.json({
        success: false,
        destinations: [],
        count: 0,
        error: 'Invalid airport code. Please use 3-letter IATA code (e.g., LAX, JFK, LHR)'
      }, { status: 400 })
    }

    // Convert hours to minutes for flight route filtering
    const minMinutes = minFlightTime * 60
    const maxMinutes = maxFlightTime * 60

    console.log('[Search API] Finding destinations:', {
      origin,
      theme,
      flightTimeRange: `${minFlightTime}h-${maxFlightTime}h`
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
      return NextResponse.json({
        success: true,
        destinations: [],
        count: 0,
        error: `No destinations found within ${minFlightTime}-${maxFlightTime} hours from ${origin}`
      })
    }

    // Extract destination airport codes
    const destinationCodes = validRoutes.map(route => route.destinationAirportCode)

    // Step 2: Get destination details for searchable airports only
    const potentialDestinations = await db.destination.findMany({
      where: {
        airportCode: {
          in: destinationCodes
        }
      },
      take: 20, // Limit to top 20 destinations
      orderBy: {
        popularityScore: 'desc'
      }
    })

    // Filter out destinations with non-searchable airports
    const searchableAirports = await db.airport.findMany({
      where: {
        iataCode: {
          in: potentialDestinations.map(d => d.airportCode)
        },
        isSearchable: true
      },
      select: {
        iataCode: true
      }
    })

    const searchableAirportCodes = new Set(searchableAirports.map(a => a.iataCode))
    const filteredDestinations = potentialDestinations.filter(dest =>
      searchableAirportCodes.has(dest.airportCode)
    )

    console.log('[Search API] Found', filteredDestinations.length, 'searchable destinations')

    // Step 3: Get real flight data for each destination (parallel)
    const today = new Date()
    const departureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    const departureDateStr = departureDate.toISOString().split('T')[0]

    const flightDataPromises = filteredDestinations.map(async (dest) => {
      try {
        const { offers, metrics } = await getCachedFlightOffers({
          origin,
          destination: dest.airportCode,
          departureDate: departureDateStr,
          adults: 1
        })

        if (offers.data.length === 0) {
          return null // No flights available for this route
        }

        // Find cheapest offer
        const cheapest = offers.data.reduce((min, offer) => {
          const currentPrice = parseFloat(offer.price.total)
          const minPrice = parseFloat(min.price.total)
          return currentPrice < minPrice ? offer : min
        })

        // Calculate actual flight duration from the cheapest offer
        const totalMinutes = cheapest.itineraries.reduce((sum, itinerary) => {
          const match = itinerary.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
          if (!match) return sum
          const hours = match[1] ? parseInt(match[1]) : 0
          const minutes = match[2] ? parseInt(match[2]) : 0
          return sum + (hours * 60) + minutes
        }, 0)

        return {
          id: dest.id,
          cityName: dest.cityName,
          countryName: dest.countryName,
          airportCode: dest.airportCode,
          description: dest.description,
          flightDuration: Math.round(totalMinutes / 60), // hours
          priceEstimate: `From ${cheapest.price.currency} $${cheapest.price.total}`,
          cheapestPrice: parseFloat(cheapest.price.total),
          currency: cheapest.price.currency,
          offersCount: offers.data.length,
          cacheSource: metrics.source,
          cacheHitTime: metrics.hitTime
        }
      } catch (error) {
        console.error(`[Search API] Failed to get flights for ${dest.airportCode}:`, error)
        return null
      }
    })

    const flightDataResults = await Promise.all(flightDataPromises)

    // Filter out nulls and sort by price
    const destinations: DestinationResponse[] = flightDataResults
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => (a.cheapestPrice || 0) - (b.cheapestPrice || 0))
      .map(({ cacheSource, cacheHitTime, ...dest }) => dest) // Remove cache metrics from public response

    // Calculate cache metrics
    const validResults = flightDataResults.filter(r => r !== null) as Array<{ cacheSource: string; cacheHitTime: number }>
    const cacheHits = validResults.filter(r => r.cacheSource !== 'amadeus').length
    const cacheMisses = validResults.filter(r => r.cacheSource === 'amadeus').length
    const avgHitTime = validResults.reduce((sum, r) => sum + r.cacheHitTime, 0) / validResults.length

    console.log('[Search API] Results:', {
      totalDestinations: destinations.length,
      cacheHits,
      cacheMisses,
      avgHitTime: Math.round(avgHitTime) + 'ms'
    })

    return NextResponse.json({
      success: true,
      destinations,
      count: destinations.length,
      cacheMetrics: {
        avgHitTime: Math.round(avgHitTime),
        cacheHits,
        cacheMisses
      }
    })

  } catch (error: unknown) {
    console.error('[Search API] Error:', error)

    return NextResponse.json({
      success: false,
      destinations: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
