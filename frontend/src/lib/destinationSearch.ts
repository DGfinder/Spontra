import { db } from '@/server/db'
import type { DestinationRecommendation } from './searchState'

export interface SearchParams {
  origin?: string
  theme?: string
  minFlightTime?: number
  maxFlightTime?: number
  maxResults?: number
}

export async function searchDestinations(params: SearchParams): Promise<DestinationRecommendation[]> {
  try {
    const { origin, theme, minFlightTime, maxFlightTime, maxResults = 20 } = params

    // Build query conditions
    const whereConditions: any = {}
    
    // If origin is specified, filter by flight routes
    if (origin && (minFlightTime || maxFlightTime)) {
      const flightRoutes = await db.flightRoute.findMany({
        where: {
          originAirportCode: origin,
          ...(minFlightTime && { totalDurationMinutes: { gte: minFlightTime * 60 } }),
          ...(maxFlightTime && { totalDurationMinutes: { lte: maxFlightTime * 60 } })
        },
        select: { destinationAirportCode: true, totalDurationMinutes: true }
      })

      const destinationCodes = flightRoutes.map(route => route.destinationAirportCode)
      if (destinationCodes.length === 0) {
        return []
      }

      whereConditions.airportCode = { in: destinationCodes }
    }

    // Get destinations
    const destinations = await db.destination.findMany({
      where: whereConditions,
      take: maxResults,
      orderBy: [
        { popularityScore: 'desc' },
        { cityName: 'asc' }
      ]
    })

    // Convert to DestinationRecommendation format
    const recommendations: DestinationRecommendation[] = destinations.map(dest => {
      // Find flight duration if origin was specified
      let durationMinutes: number | undefined
      if (origin) {
        // This is simplified - in real app we'd join this data
        durationMinutes = minFlightTime ? minFlightTime * 60 : undefined
      }

      return {
        id: dest.id,
        name: dest.cityName,
        country: dest.countryName,
        airportCode: dest.airportCode,
        city: dest.cityName,
        durationMinutes,
        theme,
        priceRange: 'From $400', // Simplified for MVP
        currency: 'USD'
      }
    })

    return recommendations
  } catch (error) {
    console.error('Destination search error:', error)
    throw new Error('Failed to search destinations')
  }
}

export async function getPopularDestinations(limit = 10): Promise<DestinationRecommendation[]> {
  try {
    const destinations = await db.destination.findMany({
      take: limit,
      orderBy: [
        { popularityScore: 'desc' },
        { cityName: 'asc' }
      ]
    })

    return destinations.map(dest => ({
      id: dest.id,
      name: dest.cityName,
      country: dest.countryName,
      airportCode: dest.airportCode,
      city: dest.cityName,
      priceRange: 'From $400',
      currency: 'USD'
    }))
  } catch (error) {
    console.error('Popular destinations error:', error)
    return []
  }
}

export async function getDestinationByCode(airportCode: string): Promise<DestinationRecommendation | null> {
  try {
    const destination = await db.destination.findUnique({
      where: { airportCode }
    })

    if (!destination) return null

    return {
      id: destination.id,
      name: destination.cityName,
      country: destination.countryName,
      airportCode: destination.airportCode,
      city: destination.cityName,
      priceRange: 'From $400',
      currency: 'USD'
    }
  } catch (error) {
    console.error('Get destination error:', error)
    return null
  }
}