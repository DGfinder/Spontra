import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { validateApiRequest, flightRedirectSchema } from '@/lib/validations'

export const runtime = 'nodejs'

interface RedirectContext {
  itineraryId: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  carrierCode: string
  flightNumber: string
  stops?: number
  price?: number
  currency?: string
  providerHint?: string
}

interface ProviderResult {
  provider: string
  url: string
}

const LOG_PREFIX = '[api/redirect/flight]'

const airlineBuilders: Record<string, (payload: RedirectContext) => string | null> = {
  BA: (payload) => buildBritishAirwaysLink(payload),
  LH: (payload) => buildLufthansaLink(payload),
  AF: (payload) => buildAirFranceLink(payload),
  KL: (payload) => buildKlmLink(payload),
}

const AFFILIATES = {
  kayak: process.env.AFFILIATE_KAYAK_ID,
  skyscanner: process.env.AFFILIATE_SKYSCANNER_ID,
  travelpayouts: process.env.AFFILIATE_TRAVELPAYOUTS_ID,
}

const clampAdults = (value: number) => Math.min(Math.max(value, 1), 8)

const mapCabin = (cabin: string, provider: 'airline' | 'kayak' | 'skyscanner' | 'travelpayouts') => {
  switch (provider) {
    case 'airline':
      return cabin === 'PREMIUM_ECONOMY' ? 'premiumEconomy' : cabin.toLowerCase()
    case 'kayak':
      return cabin === 'PREMIUM_ECONOMY' ? 'premium' : cabin.toLowerCase()
    case 'skyscanner':
      switch (cabin) {
        case 'PREMIUM_ECONOMY':
          return 'premiumeconomy'
        case 'BUSINESS':
          return 'business'
        case 'FIRST':
          return 'first'
        default:
          return 'economy'
      }
    case 'travelpayouts':
      return cabin.toLowerCase()
    default:
      return cabin.toLowerCase()
  }
}

const sanitizeDate = (input: string): string => {
  if (!input) return ''
  return input.split('T')[0]
}

const buildBritishAirwaysLink = (payload: RedirectContext): string | null => {
  const depart = sanitizeDate(payload.departureDate)
  if (!depart) return null
  const tripType = payload.returnDate ? 'R' : 'O'
  const url = new URL('https://www.britishairways.com/travel/fx/public/en_gb')
  url.searchParams.set('eId', '111083')
  url.searchParams.set('tripType', tripType)
  url.searchParams.set('from', payload.origin)
  url.searchParams.set('to', payload.destination)
  url.searchParams.set('depDate', depart)
  if (payload.returnDate) {
    url.searchParams.set('retDate', sanitizeDate(payload.returnDate))
  }
  url.searchParams.set('adult', clampAdults(payload.adults).toString())
  url.searchParams.set('cabin', mapCabin(payload.cabinClass, 'airline'))
  return url.toString()
}

const buildLufthansaLink = (payload: RedirectContext): string | null => {
  const depart = sanitizeDate(payload.departureDate)
  if (!depart) return null
  const url = new URL('https://www.lufthansa.com/search')
  url.searchParams.set('tripType', payload.returnDate ? 'roundTrip' : 'oneWay')
  url.searchParams.set('origin', payload.origin)
  url.searchParams.set('destination', payload.destination)
  url.searchParams.set('departureDate', depart)
  if (payload.returnDate) {
    url.searchParams.set('returnDate', sanitizeDate(payload.returnDate))
  }
  url.searchParams.set('adults', clampAdults(payload.adults).toString())
  url.searchParams.set('travelClass', mapCabin(payload.cabinClass, 'airline'))
  return url.toString()
}

const buildAirFranceLink = (payload: RedirectContext): string | null => {
  const depart = sanitizeDate(payload.departureDate)
  if (!depart) return null
  const url = new URL('https://wwws.airfrance.com/search')
  url.searchParams.set('origin', payload.origin)
  url.searchParams.set('destination', payload.destination)
  url.searchParams.set('departure', depart)
  if (payload.returnDate) {
    url.searchParams.set('return', sanitizeDate(payload.returnDate))
  }
  url.searchParams.set('adults', clampAdults(payload.adults).toString())
  url.searchParams.set('travelClass', mapCabin(payload.cabinClass, 'airline'))
  return url.toString()
}

const buildKlmLink = (payload: RedirectContext): string | null => {
  const depart = sanitizeDate(payload.departureDate)
  if (!depart) return null
  const url = new URL('https://www.klm.com/travel/gb_en/plan-and-book/flight-offer')
  url.searchParams.set('tripType', payload.returnDate ? 'roundtrip' : 'oneway')
  url.searchParams.set('origin', payload.origin)
  url.searchParams.set('destination', payload.destination)
  url.searchParams.set('departureDate', depart)
  if (payload.returnDate) {
    url.searchParams.set('returnDate', sanitizeDate(payload.returnDate))
  }
  url.searchParams.set('adults', clampAdults(payload.adults).toString())
  url.searchParams.set('cabinClass', mapCabin(payload.cabinClass, 'airline'))
  return url.toString()
}

const buildKayakLink = (payload: RedirectContext): ProviderResult | null => {
  const depart = sanitizeDate(payload.departureDate)
  if (!depart) return null
  const parts = [payload.origin, payload.destination, depart]
  if (payload.returnDate) {
    parts.push(sanitizeDate(payload.returnDate))
  }
  const url = new URL(`https://www.kayak.com/flights/${parts.join('/')}`)
  url.searchParams.set('sort', 'bestflight_a')
  url.searchParams.set('adults', clampAdults(payload.adults).toString())
  url.searchParams.set('cabin', mapCabin(payload.cabinClass, 'kayak'))
  if (payload.stops === 0) {
    url.searchParams.set('fs', 'stops=~0')
  }
  if (AFFILIATES.kayak) {
    url.searchParams.set('aid', AFFILIATES.kayak)
  }
  return { provider: 'kayak', url: url.toString() }
}

const buildSkyscannerLink = (payload: RedirectContext): ProviderResult | null => {
  const depart = sanitizeDate(payload.departureDate).replace(/-/g, '')
  if (!depart) return null
  let path = `${payload.origin}/${payload.destination}/${depart}`
  if (payload.returnDate) {
    path += `/${sanitizeDate(payload.returnDate).replace(/-/g, '')}`
  }
  const url = new URL(`https://www.skyscanner.net/transport/flights/${path}`)
  url.searchParams.set('adults', clampAdults(payload.adults).toString())
  url.searchParams.set('cabinclass', mapCabin(payload.cabinClass, 'skyscanner'))
  if (AFFILIATES.skyscanner) {
    url.searchParams.set('associateid', AFFILIATES.skyscanner)
  }
  return { provider: 'skyscanner', url: url.toString() }
}

const buildTravelpayoutsLink = (payload: RedirectContext): ProviderResult | null => {
  const depart = sanitizeDate(payload.departureDate)
  if (!depart) return null
  const url = new URL('https://www.travelpayouts.com/redirects/flights')
  url.searchParams.set('origin', payload.origin)
  url.searchParams.set('destination', payload.destination)
  url.searchParams.set('departure_date', depart)
  if (payload.returnDate) {
    url.searchParams.set('return_date', sanitizeDate(payload.returnDate))
  }
  url.searchParams.set('adults', clampAdults(payload.adults).toString())
  url.searchParams.set('travel_class', mapCabin(payload.cabinClass, 'travelpayouts'))
  if (AFFILIATES.travelpayouts) {
    url.searchParams.set('marker', AFFILIATES.travelpayouts)
  }
  return { provider: 'travelpayouts', url: url.toString() }
}

const buildAggregatorLink = (payload: RedirectContext): ProviderResult | null => {
  return buildKayakLink(payload) || buildSkyscannerLink(payload) || buildTravelpayoutsLink(payload)
}

const detectDevice = (userAgent: string | null): 'desktop' | 'mobile' | 'tablet' => {
  if (!userAgent) return 'desktop'
  const ua = userAgent.toLowerCase()
  if (ua.includes('ipad') || ua.includes('tablet')) return 'tablet'
  if (ua.includes('mobi') || ua.includes('iphone') || (ua.includes('android') && !ua.includes('tablet'))) return 'mobile'
  return 'desktop'
}

const chooseProvider = (payload: RedirectContext): ProviderResult | null => {
  const carrier = payload.carrierCode?.toUpperCase()
  if (carrier && airlineBuilders[carrier]) {
    const directUrl = airlineBuilders[carrier](payload)
    if (directUrl) {
      return { provider: `airline-${carrier}`, url: directUrl }
    }
  }
  return buildAggregatorLink(payload)
}

const logClickEvent = async (
  req: NextRequest,
  payload: RedirectContext,
  provider: string,
  url: string,
) => {
  try {
    const clickPayload = {
      id: randomUUID(),
      partnerId: provider,
      flightId: payload.itineraryId,
      bookingValue: payload.price ?? 0,
      currency: payload.currency ?? 'USD',
      origin: payload.origin,
      destination: payload.destination,
      departureDate: payload.departureDate,
      passengers: clampAdults(payload.adults),
      cabinClass: payload.cabinClass,
      deviceType: detectDevice(req.headers.get('user-agent')),
      sessionId: req.headers.get('x-session-id') || randomUUID(),
      userAgent: req.headers.get('user-agent') || '',
      referrer: req.headers.get('referer') || '',
      utm: {},
      timestamp: new Date().toISOString(),
    }

    const analyticsUrl = new URL('/api/analytics/click', req.nextUrl.origin)
    await fetch(analyticsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clickPayload),
      cache: 'no-store',
    })
  } catch (error) {
    console.warn(`${LOG_PREFIX} analytics logging failed`, error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateApiRequest(flightRedirectSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid flight redirect request',
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    const context = validation.data
    const providerResult = chooseProvider(context)

    if (!providerResult) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unable to generate booking link at this time. Please try again later.',
        },
        { status: 503 },
      )
    }

    await logClickEvent(req, context, providerResult.provider, providerResult.url)

    return NextResponse.json({
      ok: true,
      provider: providerResult.provider,
      url: providerResult.url,
    })
  } catch (error) {
    console.error(`${LOG_PREFIX} redirect error`, error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to prepare booking redirect. Please try again later.',
      },
      { status: 500 },
    )
  }
}
