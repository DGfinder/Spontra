import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCachedFlightOffers } from '@/lib/cache'
import { formatDuration } from '@/lib/amadeus'

interface SearchRequest {
  departureAirport: string
  destinationAirport?: string
  theme: string
  minFlightTime: number
  maxFlightTime: number
  passengers: number
  cabin: string
}

interface DestinationResponse {
  id: string
  cityName: string
  country: {
    name: string
    code: string
  }
  airportCode: string  // Primary airport IATA code
  airportName?: string // Primary airport name
  description?: string | null
  themePOIs?: Array<{
    id: string
    name: string
    description: string | null
    videoUrl: string | null
  }>
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
    const { departureAirport, destinationAirport, theme, minFlightTime, maxFlightTime, passengers, cabin } = body

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

    // Step 2: Get destinations with their primary airports via join table
    // Use raw SQL to query the many-to-many relationship
    type DestinationWithAirport = {
      destination_id: string
      city_name: string
      country_id: string | null
      description: string | null
      popularity_score: string | null
      airport_code: string
      airport_name: string
      is_primary: boolean
      is_searchable: boolean
      country_name: string | null
      country_code: string | null
    }

    // Build the query based on whether specific destination is requested
    const destinationsWithAirports = destinationAirport && destinationAirport.trim()
      ? await db.$queryRaw<DestinationWithAirport[]>`
          SELECT DISTINCT ON (d.id)
            d.id as destination_id,
            d.city_name,
            d.country_id,
            d.description,
            d.popularity_score,
            da.airport_code,
            a.name as airport_name,
            da.is_primary,
            a.is_searchable,
            c.name as country_name,
            c.code as country_code
          FROM destinations d
          INNER JOIN destination_airports da ON d.id = da.destination_id
          INNER JOIN airports a ON da.airport_code = a.iata_code
          LEFT JOIN countries c ON d.country_id = c.id
          WHERE a.is_searchable = true
            AND da.airport_code = ${destinationAirport.toUpperCase().trim()}
            AND EXISTS (
              SELECT 1 FROM theme_pois tp
              WHERE tp.destination_id = d.id
              AND tp.theme = ${theme}
            )
          ORDER BY d.id, da.is_primary DESC, da.airport_code ASC
          LIMIT 20
        `
      : await db.$queryRaw<DestinationWithAirport[]>`
          SELECT DISTINCT ON (d.id)
            d.id as destination_id,
            d.city_name,
            d.country_id,
            d.description,
            d.popularity_score,
            da.airport_code,
            a.name as airport_name,
            da.is_primary,
            a.is_searchable,
            c.name as country_name,
            c.code as country_code
          FROM destinations d
          INNER JOIN destination_airports da ON d.id = da.destination_id
          INNER JOIN airports a ON da.airport_code = a.iata_code
          LEFT JOIN countries c ON d.country_id = c.id
          WHERE a.is_searchable = true
            AND da.airport_code = ANY(${destinationCodes})
            AND EXISTS (
              SELECT 1 FROM theme_pois tp
              WHERE tp.destination_id = d.id
              AND tp.theme = ${theme}
            )
          ORDER BY d.id, da.is_primary DESC, da.airport_code ASC
          LIMIT 20
        `

    // Fetch theme POIs for matched destinations
    const destinationIds = destinationsWithAirports.map(d => d.destination_id)
    const themePOIs = destinationIds.length > 0 ? await db.themePOI.findMany({
      where: {
        destinationId: { in: destinationIds },
        theme: theme
      },
      orderBy: { displayOrder: 'asc' }
    }) : []

    // Group POIs by destination
    const poisByDest = new Map<string, typeof themePOIs>()
    for (const poi of themePOIs) {
      if (!poisByDest.has(poi.destinationId)) {
        poisByDest.set(poi.destinationId, [])
      }
      poisByDest.get(poi.destinationId)!.push(poi)
    }

    // Build structured destination objects
    const filteredDestinations = destinationsWithAirports.map(d => ({
      id: d.destination_id,
      cityName: d.city_name,
      description: d.description,
      popularityScore: d.popularity_score ? parseFloat(d.popularity_score) : null,
      country: d.country_name && d.country_code ? {
        name: d.country_name,
        code: d.country_code
      } : null,
      primaryAirport: {
        iataCode: d.airport_code,
        name: d.airport_name,
        isPrimary: d.is_primary
      },
      themePOIs: poisByDest.get(d.destination_id) || []
    }))

    console.log('[Search API] Found', filteredDestinations.length, 'searchable destinations')

    // Step 3: Get real flight data for each destination (parallel)
    const today = new Date()
    const departureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    const departureDateStr = departureDate.toISOString().split('T')[0]

    const flightDataPromises = filteredDestinations.map(async (dest) => {
      try {
        const airportCode = dest.primaryAirport.iataCode

        const { offers, metrics } = await getCachedFlightOffers({
          origin,
          destination: airportCode,
          departureDate: departureDateStr,
          adults: passengers || 1
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

        // Auto-populate flight route (create only, never update)
        try {
          const existingRoute = await db.flightRoute.findUnique({
            where: {
              originAirportCode_destinationAirportCode: {
                originAirportCode: origin,
                destinationAirportCode: airportCode
              }
            }
          })

          if (!existingRoute) {
            await db.flightRoute.create({
              data: {
                originAirportCode: origin,
                destinationAirportCode: airportCode,
                totalDurationMinutes: totalMinutes
              }
            })
            console.log(`[Auto-populate] Created route: ${origin} → ${airportCode} (${totalMinutes}m)`)
          }
        } catch (error) {
          // Non-blocking - don't fail search if route creation fails
          console.error('[Auto-populate] Route creation failed:', error)
        }

        return {
          id: dest.id,
          cityName: dest.cityName,
          country: {
            name: dest.country?.name || '',
            code: dest.country?.code || ''
          },
          airportCode: airportCode,
          airportName: dest.primaryAirport.name,
          description: dest.description,
          themePOIs: dest.themePOIs.map(poi => ({
            id: poi.id,
            name: poi.name,
            description: poi.description,
            videoUrl: poi.videoUrl
          })),
          flightDuration: Math.round(totalMinutes / 60), // hours
          priceEstimate: `From ${cheapest.price.currency} $${cheapest.price.total}`,
          cheapestPrice: parseFloat(cheapest.price.total),
          currency: cheapest.price.currency,
          offersCount: offers.data.length,
          cacheSource: metrics.source,
          cacheHitTime: metrics.hitTime
        }
      } catch (error) {
        console.error(`[Search API] Failed to get flights for ${dest.primaryAirport.iataCode}:`, error)
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
