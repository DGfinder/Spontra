import { NextRequest, NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeus-simple'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('✈️ Real-time flights API called')
  
  try {
    const body = await req.json()
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      passengers = 1, 
      travelClass = 'ECONOMY',
      nonStop = false
    } = body
    
    console.log('📝 Flight search parameters:', { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      passengers,
      travelClass,
      nonStop 
    })

    if (!origin || !destination || !departureDate) {
      console.log('❌ Missing required parameters')
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required params: origin, destination, departureDate' 
      }, { status: 400 })
    }

    console.log('🔍 Checking amadeusClient availability...')
    if (!amadeusClient) {
      console.error('❌ AmadeusClient is null/undefined')
      return NextResponse.json({ 
        ok: false, 
        error: 'Flight search service temporarily unavailable. Please try again later.',
        fallback: true
      }, { status: 503 })
    }

    console.log('🛫 Calling amadeusClient.searchFlights for real-time pricing...')
    // Use simple Amadeus client to fetch offers
    const offers = await amadeusClient.searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: passengers,
      travelClass,
      nonStop,
      max: 20,
    })

    // Map to a lightweight shape for the UI
    const flights = (offers || []).slice(0, 12).map((offer: any, idx: number) => {
      const firstItin = offer.itineraries?.[0]
      const firstSeg = firstItin?.segments?.[0]
      const lastSeg = firstItin?.segments?.[firstItin?.segments?.length - 1]
      const duration = firstItin?.duration || ''
      const depISO = firstSeg?.departure?.at || ''
      const arrISO = lastSeg?.arrival?.at || ''
      const formatHM = (iso: string) => iso ? new Date(iso).toISOString().substring(11,16) : ''
      const priceTotal = Number.parseFloat(offer?.price?.total || '0')
      return {
        id: offer.id || `offer-${idx}`,
        price: Math.round(priceTotal),
        currency: offer?.price?.currency || 'EUR',
        departureTime: formatHM(depISO),
        arrivalTime: formatHM(arrISO),
        duration,
        stops: (firstItin?.segments?.length || 1) - 1,
        airline: firstSeg?.carrierCode || offer?.validatingAirlineCodes?.[0] || 'XX',
        aircraftType: firstSeg?.aircraft?.code || '',
        bookingLink: '',
      }
    })

    console.log('✅ Flight search successful, returning:', flights.length, 'processed offers')
    
    return NextResponse.json({ 
      ok: true, 
      data: flights,
      meta: {
        totalResults: flights.length,
        searchTimestamp: new Date().toISOString(),
        dataSource: 'amadeus-real-time'
      }
    })
  } catch (e: any) {
    console.error('💥 Real-time flights API error:', {
      message: e?.message,
      stack: e?.stack,
      name: e?.name,
      cause: e?.cause
    })
    
    // Check for specific Amadeus API errors
    if (e?.message?.includes('Flight search failed')) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'No flights found for the selected route and date. Please try different dates or airports.',
          searchable: true
        },
        { status: 404 }
      )
    }
    
    // Check for authentication/credentials errors
    if (e?.message?.includes('credentials') || e?.message?.includes('authentication')) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Flight search service configuration error. Please contact support.',
          fallback: true
        },
        { status: 503 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { 
        ok: false, 
        error: 'An unexpected error occurred while searching flights. Please try again.',
        fallback: true
      },
      { status: 500 }
    )
  }
}
