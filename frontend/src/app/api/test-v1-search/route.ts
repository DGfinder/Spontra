import { NextRequest, NextResponse } from 'next/server'
import { searchFlightsRealtime } from '@/app/actions/travelpayouts'

/**
 * Test endpoint for V1 Real-Time Flight Search
 * POST /api/test-v1-search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, departureDate, returnDate, adults } = body

    if (!origin || !destination || !departureDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: origin, destination, departureDate'
      }, { status: 400 })
    }

    const result = await searchFlightsRealtime({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: adults || 1
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Test V1 API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
