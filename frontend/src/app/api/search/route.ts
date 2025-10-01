import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
}

interface SearchResponse {
  success: boolean
  destinations: DestinationResponse[]
  count: number
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

    // For now, use mock data to ensure build success
    // TODO: Replace with real database queries once foundation is stable
    const mockDestinations: DestinationResponse[] = [
      {
        id: '1',
        cityName: 'Paris',
        countryName: 'France',
        airportCode: 'CDG',
        description: 'The City of Light awaits with its romantic charm and cultural treasures',
        flightDuration: Math.floor(Math.random() * (maxFlightTime - minFlightTime + 1)) + minFlightTime,
        priceEstimate: 'From $650'
      },
      {
        id: '2',
        cityName: 'Tokyo',
        countryName: 'Japan',
        airportCode: 'NRT',
        description: 'Experience the perfect blend of ancient traditions and cutting-edge technology',
        flightDuration: Math.floor(Math.random() * (maxFlightTime - minFlightTime + 1)) + minFlightTime,
        priceEstimate: 'From $850'
      },
      {
        id: '3',
        cityName: 'Barcelona',
        countryName: 'Spain',
        airportCode: 'BCN',
        description: 'Discover Gaudí\'s masterpieces and vibrant Mediterranean culture',
        flightDuration: Math.floor(Math.random() * (maxFlightTime - minFlightTime + 1)) + minFlightTime,
        priceEstimate: 'From $480'
      }
    ].filter(dest => 
      dest.flightDuration! >= minFlightTime && dest.flightDuration! <= maxFlightTime
    )

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      destinations: mockDestinations,
      count: mockDestinations.length
    })

  } catch (error: unknown) {
    console.error('Search API error:', error)
    
    return NextResponse.json({
      success: false,
      destinations: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}