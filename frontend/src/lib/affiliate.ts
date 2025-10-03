/**
 * Affiliate Link Generation Utilities
 * Generates deep links to metasearch providers with affiliate tracking
 */

export interface FlightSearchParams {
  origin: string  // IATA code
  destination: string  // IATA code
  departureDate?: string  // YYYY-MM-DD
  returnDate?: string  // YYYY-MM-DD
  adults?: number
  cabin?: 'economy' | 'premium_economy' | 'business' | 'first'
}

/**
 * Generate Skyscanner affiliate link
 * Skyscanner Partner Network: https://partners.skyscanner.net/
 */
export function generateSkyscannerLink(params: FlightSearchParams): string {
  const { origin, destination, departureDate, returnDate, adults = 1, cabin = 'economy' } = params

  // Base URL format
  const baseUrl = 'https://www.skyscanner.com/transport/flights'

  // Build URL path
  const path = returnDate
    ? `${origin}/${destination}/${departureDate}/${returnDate}`  // Round trip
    : `${origin}/${destination}/${departureDate}`  // One way

  // Build query params
  const queryParams = new URLSearchParams({
    adults: adults.toString(),
    cabinclass: cabin,
    // Add affiliate params when available:
    // associateid: process.env.NEXT_PUBLIC_SKYSCANNER_AFFILIATE_ID || '',
  })

  return `${baseUrl}/${path}/?${queryParams.toString()}`
}

/**
 * Generate Google Flights link
 * Note: Google Flights doesn't have public affiliate program
 */
export function generateGoogleFlightsLink(params: FlightSearchParams): string {
  const { origin, destination, departureDate, returnDate, adults = 1 } = params

  const baseUrl = 'https://www.google.com/travel/flights'

  const queryParams = new URLSearchParams({
    q: `Flights from ${origin} to ${destination}`,
    tfs: JSON.stringify({
      f: [
        {
          d: origin,
          a: destination,
          dd: departureDate
        },
        ...(returnDate ? [{
          d: destination,
          a: origin,
          dd: returnDate
        }] : [])
      ],
      p: adults
    })
  })

  return `${baseUrl}?${queryParams.toString()}`
}

/**
 * Generate Kayak affiliate link
 * KAYAK Affiliate Network: https://www.kayak.com/affiliate
 */
export function generateKayakLink(params: FlightSearchParams): string {
  const { origin, destination, departureDate, returnDate, adults = 1 } = params

  const baseUrl = 'https://www.kayak.com/flights'

  const path = returnDate
    ? `${origin}-${destination}/${departureDate}/${returnDate}/${adults}adults`
    : `${origin}-${destination}/${departureDate}/${adults}adults`

  // Add affiliate param when available:
  // ?a=AFFILIATE_ID

  return `${baseUrl}/${path}`
}

/**
 * Generate Momondo link (owned by Kayak/Booking Holdings)
 */
export function generateMomondoLink(params: FlightSearchParams): string {
  const { origin, destination, departureDate, returnDate, adults = 1 } = params

  const queryParams = new URLSearchParams({
    Search: 'true',
    TripType: returnDate ? '2' : '1',  // 1=one-way, 2=round-trip
    SegNo: '0',
    SO0: origin,
    SD0: destination,
    SDP0: departureDate || '',
    ...(returnDate && {
      SO1: destination,
      SD1: origin,
      SDP1: returnDate
    }),
    AD: adults.toString(),
    // Add affiliate param when available:
    // ispredir: '1',
    // partner: 'AFFILIATE_ID'
  })

  return `https://www.momondo.com/flight-search?${queryParams.toString()}`
}

/**
 * Generate multi-provider comparison URL
 * Returns primary + fallback options
 */
export function generateFlightLinks(params: FlightSearchParams) {
  return {
    primary: generateSkyscannerLink(params),
    alternatives: {
      kayak: generateKayakLink(params),
      google: generateGoogleFlightsLink(params),
      momondo: generateMomondoLink(params)
    }
  }
}

/**
 * Track affiliate click (for analytics)
 * TODO: Implement with analytics service (Vercel Analytics, Google Analytics, etc.)
 */
export function trackAffiliateClick(params: {
  provider: string
  origin: string
  destination: string
  userId?: string
}) {
  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'affiliate_click', {
      provider: params.provider,
      origin: params.origin,
      destination: params.destination,
      user_id: params.userId
    })
  }

  // Log for debugging
  console.log('[Affiliate Click]', params)
}

// Type augmentation for window.gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}
