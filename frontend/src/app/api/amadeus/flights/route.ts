import { NextRequest, NextResponse } from 'next/server'
import { amadeusService } from '@/services/amadeusService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, departureDate, passengers = 1, travelClass = 'ECONOMY', nonStop } = await req.json()

    if (!origin || !destination || !departureDate) {
      return NextResponse.json({ ok: false, error: 'Missing required params: origin, destination, departureDate' }, { status: 400 })
    }

    // Use existing server-side service to fetch offers
    const offers = await amadeusService.searchFlights({
      origin,
      destination,
      departureDate,
      adults: passengers,
      travelClass,
      nonStop,
      max: 20,
    } as any)

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

    return NextResponse.json({ ok: true, data: flights })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Internal Server Error' }, { status: 500 })
  }
}

