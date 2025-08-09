import { NextRequest, NextResponse } from 'next/server'
import { amadeusService } from '@/services/amadeusService'

// Ensure this runs in a Node.js runtime so server env vars are available
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('🚀 Destinations API called')
  
  try {
    const body = await req.json()
    const { origin, maxFlightTime, theme, departureDate } = body
    
    console.log('📝 Request parameters:', { origin, maxFlightTime, theme, departureDate })

    if (!origin) {
      console.log('❌ Missing origin parameter')
      return NextResponse.json({ ok: false, error: 'Missing required parameter: origin' }, { status: 400 })
    }

    console.log('🛫 Calling amadeusService.exploreDestinations with cached pricing...')
    const recommendations = await amadeusService.exploreDestinations({
      origin,
      maxFlightTime,
      theme,
      departureDate,
      viewBy: 'PRICE' // Use PRICE view for cached pricing sorted by cost
    })

    console.log('✅ API call successful, recommendations count:', recommendations?.length || 0)
    return NextResponse.json({ ok: true, data: recommendations })
  } catch (e: any) {
    console.error('💥 Destinations API error:', {
      message: e?.message,
      stack: e?.stack,
      name: e?.name,
      cause: e?.cause
    })
    
    // Check for specific Amadeus API errors
    if (e?.message?.includes('Amadeus API Error')) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Unable to search destinations at this time. Please try a different airport or check back later.',
          fallback: true
        },
        { status: 503 }
      )
    }
    
    // Check for authentication/credentials errors
    if (e?.message?.includes('credentials') || e?.message?.includes('authentication')) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Travel search service configuration error. Please contact support.',
          fallback: true
        },
        { status: 503 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { 
        ok: false, 
        error: 'An unexpected error occurred while searching destinations. Please try again.',
        fallback: true
      },
      { status: 500 }
    )
  }
}

