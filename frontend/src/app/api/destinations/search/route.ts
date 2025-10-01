import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function POST(request: NextRequest) {
  try {
    const { departureAirport, theme, minFlightTime, maxFlightTime } = await request.json()

    // Build query for destinations with flight time constraints
    let destinations = []

    if (departureAirport && minFlightTime && maxFlightTime) {
      // Find destinations reachable within flight time constraints
      const flightRoutes = await db.flightRoute.findMany({
        where: {
          originAirportCode: departureAirport,
          totalDurationMinutes: {
            gte: minFlightTime * 60,
            lte: maxFlightTime * 60
          }
        },
        include: {
          destinationAirport: true
        },
        take: 20
      })

      // Get destinations for these routes
      const destinationCodes = flightRoutes.map(route => route.destinationAirportCode)
      
      if (destinationCodes.length > 0) {
        const destinationData = await db.destination.findMany({
          where: {
            airportCode: { in: destinationCodes }
          },
          orderBy: [
            { popularityScore: 'desc' },
            { cityName: 'asc' }
          ]
        })

        destinations = destinationData.map(dest => {
          const route = flightRoutes.find(r => r.destinationAirportCode === dest.airportCode)
          return {
            id: dest.id,
            cityName: dest.cityName,
            countryName: dest.countryName,
            airportCode: dest.airportCode,
            description: dest.description,
            imageUrl: dest.imageUrl,
            flightDuration: route ? Math.round(route.totalDurationMinutes / 60) : undefined,
            priceEstimate: 'From $400' // Simplified for MVP
          }
        })
      }
    } else {
      // If no flight constraints, return popular destinations
      const popularDestinations = await db.destination.findMany({
        take: 15,
        orderBy: [
          { popularityScore: 'desc' },
          { cityName: 'asc' }
        ]
      })

      destinations = popularDestinations.map(dest => ({
        id: dest.id,
        cityName: dest.cityName,
        countryName: dest.countryName,
        airportCode: dest.airportCode,
        description: dest.description,
        imageUrl: dest.imageUrl,
        priceEstimate: 'From $300'
      }))
    }

    return NextResponse.json({
      success: true,
      destinations,
      count: destinations.length
    })

  } catch (error) {
    console.error('Destination search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search destinations',
      destinations: []
    }, { status: 500 })
  }
}