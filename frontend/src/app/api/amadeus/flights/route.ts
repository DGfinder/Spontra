import { NextRequest, NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeusSimple'
import { AmadeusFlightOffer } from '@/types/amadeus'
import { validateApiRequest, flightSearchApiSchema } from '@/lib/validations'

export const runtime = 'nodejs'

type FlightSearchParams = {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  travelClass: string
  nonStop: boolean
}

type FlightOfferLite = {
  id: string
  itineraryId: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  travelClass: string
  price: number
  currency: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  carrierCode: string
  flightNumber: string
  aircraftType: string
  arrivalContext: string
  confidence: number
  priceBreakdown: {
    baseFare: number
    taxes: number
    fees: number
  }
  legs: Array<{
    legId: string
    segments: Array<{
      carrierCode: string
      operatingCarrierCode: string
      flightNumber: string
      departure: { iataCode?: string; at?: string; terminal?: string }
      arrival: { iataCode?: string; at?: string; terminal?: string }
      duration?: string
      aircraftCode?: string
      numberOfStops?: number
    }>
    duration?: string
  }>
  deeplinkContext: {
    itineraryId: string
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
    adults: number
    cabinClass: string
    carrierCode: string
    flightNumber: string
    stops: number
    price?: number
    currency?: string
  }
}

const LOG_PREFIX = '[api/amadeus/flights]'

const formatHm = (iso?: string): string => {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().substring(11, 16)
  } catch {
    return ''
  }
}

const buildLegs = (offer: AmadeusFlightOffer): FlightOfferLite['legs'] => {
  const itineraries = offer.itineraries ?? []
  return itineraries.map((itinerary, itineraryIndex) => {
    const segments = itinerary?.segments ?? []
    return {
      legId: `${offer.id ?? 'itinerary'}-${itineraryIndex}`,
      duration: itinerary?.duration,
      segments: segments.map((segment) => ({
        carrierCode: segment?.carrierCode ?? offer.validatingAirlineCodes?.[0] ?? 'XX',
        operatingCarrierCode: segment?.operating?.carrierCode ?? segment?.carrierCode ?? 'XX',
        flightNumber: segment?.number ?? '',
        departure: segment?.departure ?? {},
        arrival: segment?.arrival ?? {},
        duration: segment?.duration,
        aircraftCode: segment?.aircraft?.code,
        numberOfStops: segment?.numberOfStops,
      })),
    }
  })
}

const mapOfferToLite = (
  offer: AmadeusFlightOffer,
  index: number,
  params: FlightSearchParams
): FlightOfferLite => {
  const itineraries = offer.itineraries ?? []
  const firstItinerary = itineraries[0]
  const firstSegments = firstItinerary?.segments ?? []
  const firstSegment = firstSegments[0]
  const lastSegment = firstSegments[firstSegments.length - 1]

  const priceTotal = Number.parseFloat(offer?.price?.total || '0')
  const baseFare = Number.parseFloat(offer?.price?.base || '0')
  const fees = Array.isArray(offer?.price?.fees)
    ? offer.price.fees.reduce((sum, fee) => sum + (Number.parseFloat(fee.amount) || 0), 0)
    : 0
  const taxes = Math.max(0, priceTotal - (Number.isFinite(baseFare) ? baseFare : 0) - fees)

  const arrivalHour = lastSegment?.arrival?.at ? new Date(lastSegment.arrival.at).getUTCHours() : 12
  const arrivalContext = arrivalHour < 12
    ? 'morning arrival'
    : arrivalHour < 18
      ? 'afternoon arrival'
      : arrivalHour < 22
        ? 'evening arrival'
        : 'late night arrival'

  const carrierCode = firstSegment?.carrierCode || offer.validatingAirlineCodes?.[0] || 'XX'
  const flightNumber = firstSegment?.number || ''

  return {
    id: offer.id || `offer-${index}`,
    itineraryId: offer.id || `itinerary-${index}`,
    origin: firstSegment?.departure?.iataCode || params.origin,
    destination: lastSegment?.arrival?.iataCode || params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    adults: params.passengers,
    travelClass: params.travelClass,
    price: Math.round(priceTotal),
    currency: offer?.price?.currency || 'EUR',
    departureTime: formatHm(firstSegment?.departure?.at),
    arrivalTime: formatHm(lastSegment?.arrival?.at),
    duration: firstItinerary?.duration || '',
    stops: Math.max(0, (firstItinerary?.segments?.length || 1) - 1),
    carrierCode,
    flightNumber,
    aircraftType: firstSegment?.aircraft?.code || 'A320',
    arrivalContext,
    confidence: 95 - Math.min(index, 10),
    priceBreakdown: {
      baseFare: Math.round(Number.isFinite(baseFare) ? baseFare : Math.round(priceTotal * 0.75)),
      taxes: Math.round(taxes),
      fees: Math.round(fees),
    },
    legs: buildLegs(offer),
    deeplinkContext: {
      itineraryId: offer.id || `itinerary-${index}`,
      origin: firstSegment?.departure?.iataCode || params.origin,
      destination: lastSegment?.arrival?.iataCode || params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.passengers,
      cabinClass: params.travelClass,
      carrierCode,
      flightNumber,
      stops: Math.max(0, (firstItinerary?.segments?.length || 1) - 1),
      price: Number.isFinite(priceTotal) ? priceTotal : undefined,
      currency: offer?.price?.currency,
    },
  }
}

export async function POST(req: NextRequest) {
  console.log(`${LOG_PREFIX} search requested`)

  try {
    const body = await req.json()
    const validation = validateApiRequest(flightSearchApiSchema, body)

    if (!validation.success) {
      console.log(`${LOG_PREFIX} invalid request`, validation.errors)
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid flight search parameters',
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      travelClass = 'ECONOMY',
      nonStop = false,
    } = validation.data

    const params: FlightSearchParams = {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      travelClass,
      nonStop,
    }

    if (!amadeusClient) {
      console.error(`${LOG_PREFIX} amadeus client not configured`)
      return NextResponse.json(
        {
          ok: false,
          error: 'Flight search service temporarily unavailable. Please try again later.',
          fallback: true,
        },
        { status: 503 },
      )
    }

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

    const flights = (offers || [])
      .slice(0, 12)
      .map((offer: AmadeusFlightOffer, index: number) => mapOfferToLite(offer, index, params))

    console.log(`${LOG_PREFIX} returning ${flights.length} offers`)

    return NextResponse.json({
      ok: true,
      data: flights,
      meta: {
        totalResults: flights.length,
        searchTimestamp: new Date().toISOString(),
        dataSource: 'amadeus-real-time',
      },
    })
  } catch (error) {
    console.error(`${LOG_PREFIX} error`, error)

    if (error instanceof Error) {
      if (error.message.includes('Flight search failed')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'No flights found for the selected route and date. Please try different dates or airports.',
            searchable: true,
          },
          { status: 404 },
        )
      }

      if (error.message.includes('credentials') || error.message.includes('authentication')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Flight search service configuration error. Please contact support.',
            fallback: true,
          },
          { status: 503 },
        )
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'An unexpected error occurred while searching flights. Please try again.',
        fallback: true,
      },
      { status: 500 },
    )
  }
}
