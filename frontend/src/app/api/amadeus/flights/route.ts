import { NextRequest, NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeusSimple'
import { AmadeusFlightOffer } from '@/types/amadeus'
import { validateApiRequest, flightSearchApiSchema } from '@/lib/validations'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('✈️ Real-time flights API called')
  
  try {
    const body = await req.json()
    
    // Validate and sanitize request body
    const validation = validateApiRequest(flightSearchApiSchema, body)
    if (!validation.success) {
      console.log('❌ Invalid flight search parameters:', validation.errors)
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid flight search parameters',
        details: validation.errors
      }, { status: 400 })
    }

    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      passengers = 1, 
      travelClass = 'ECONOMY',
      nonStop = false
    } = validation.data
    
    console.log('📝 Flight search parameters:', { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      passengers,
      travelClass,
      nonStop 
    })

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
    const flights = (offers || []).slice(0, 12).map((offer: AmadeusFlightOffer, idx: number) => {
      const firstItin = offer.itineraries?.[0]
      const firstSeg = firstItin?.segments?.[0]
      const lastSeg = firstItin?.segments?.[firstItin?.segments?.length - 1]
      const duration = firstItin?.duration || ''
      const depISO = firstSeg?.departure?.at || ''
      const arrISO = lastSeg?.arrival?.at || ''
      const formatHM = (iso: string) => {
        if (!iso) return ''
        try {
          const d = new Date(iso)
          return d.toISOString().substring(11, 16)
        } catch { return '' }
      }
      const priceTotal = Number.parseFloat(offer?.price?.total || '0')
      const baseFare = Number.parseFloat(offer?.price?.base || '0')
      const feeSum = Array.isArray(offer?.price?.fees) ? offer.price.fees.reduce((s, f) => s + (Number.parseFloat(f.amount) || 0), 0) : 0
      const taxes = Math.max(0, priceTotal - (Number.isFinite(baseFare) ? baseFare : 0) - feeSum)
      const totalPrice = Math.round(priceTotal)

      // Deterministic confidence based on relative price ranking
      const confidence = 95 - Math.min(idx, 10)

      // Arrival context based on arrival time-of-day
      const hour = arrISO ? new Date(arrISO).getUTCHours() : 12
      const context = hour < 12 ? 'morning arrival' : hour < 18 ? 'afternoon arrival' : hour < 22 ? 'evening arrival' : 'late night arrival'

      return {
        id: offer.id || `offer-${idx}`,
        price: totalPrice,
        currency: offer?.price?.currency || 'EUR',
        departureTime: formatHM(depISO),
        arrivalTime: formatHM(arrISO),
        duration,
        stops: (firstItin?.segments?.length || 1) - 1,
        airline: firstSeg?.carrierCode || offer?.validatingAirlineCodes?.[0] || 'XX',
        aircraftType: firstSeg?.aircraft?.code || 'A320',
        // Optional fields derived deterministically
        arrivalContext: context,
        confidence,
        priceBreakdown: {
          baseFare: Math.round(Number.isFinite(baseFare) ? baseFare : Math.round(priceTotal * 0.75)),
          taxes: Math.round(taxes),
          fees: Math.round(feeSum)
        }
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
  } catch (e: unknown) {
    const error = e as Error
    console.error('💥 Real-time flights API error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: (error as any)?.cause
    })
    
    // Check for specific Amadeus API errors
    if (error?.message?.includes('Flight search failed')) {
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
    if (error?.message?.includes('credentials') || error?.message?.includes('authentication')) {
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
