/**
 * Affiliate Click Tracking Library
 *
 * Tracks clicks to affiliate partner links (Skyscanner, KAYAK, Google Flights)
 * for commission attribution. Respects cookie consent (GDPR compliance).
 */

import { hasConsent } from './cookies'

export type AffiliatePartner = 'skyscanner' | 'kayak' | 'google_flights' | 'other'

export interface AffiliateClickData {
  partner: AffiliatePartner
  clickUrl: string
  destinationId?: string
  originAirport?: string
  destinationAirport?: string
  sessionId?: string
}

/**
 * Track affiliate link click
 *
 * @param data - Affiliate click data
 * @returns Promise<string | null> - Click ID if tracked successfully
 */
export async function trackAffiliateClick(data: AffiliateClickData): Promise<string | null> {
  // Check cookie consent - only track if marketing cookies are enabled
  if (!hasConsent('marketing')) {
    console.log('[Affiliate Tracking] Skipped - no marketing cookie consent')
    return null
  }

  try {
    const response = await fetch('/api/tracking/affiliate-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('[Affiliate Tracking] Click tracked:', data.partner, result.clickId)

      // Store click ID in localStorage for booking confirmation
      if (result.clickId) {
        localStorage.setItem('last_affiliate_click_id', result.clickId)
      }

      return result.clickId
    } else {
      console.error('[Affiliate Tracking] Failed to track click:', response.statusText)
      return null
    }
  } catch (error) {
    console.error('[Affiliate Tracking] Error tracking click:', error)
    return null
  }
}

/**
 * Build Skyscanner affiliate link
 *
 * @param params - Search parameters
 * @returns Affiliate URL
 */
export function buildSkyscannerLink(params: {
  originAirport: string
  destinationAirport: string
  departureDate?: string
  returnDate?: string
  adults?: number
}): string {
  const { originAirport, destinationAirport, departureDate, returnDate, adults = 1 } = params

  // Base Skyscanner URL
  let url = `https://www.skyscanner.com/transport/flights/${originAirport}/${destinationAirport}`

  // Add dates if provided
  if (departureDate) {
    const formattedDeparture = departureDate.replace(/-/g, '')
    url += `/${formattedDeparture}`

    if (returnDate) {
      const formattedReturn = returnDate.replace(/-/g, '')
      url += `/${formattedReturn}`
    }
  }

  // Add query parameters
  const queryParams = new URLSearchParams({
    adults: adults.toString(),
    children: '0',
    adultsv2: adults.toString(),
    childrenv2: '',
    infants: '0',
    cabinclass: 'economy',
    rtn: returnDate ? '1' : '0',
    preferdirects: 'false',
    outboundaltsenabled: 'false',
    inboundaltsenabled: 'false',
    // TODO: Add actual Skyscanner affiliate ID when you have one
    // associateid: 'YOUR_SKYSCANNER_AFFILIATE_ID'
  })

  return `${url}?${queryParams.toString()}`
}

/**
 * Build KAYAK affiliate link
 *
 * @param params - Search parameters
 * @returns Affiliate URL
 */
export function buildKayakLink(params: {
  originAirport: string
  destinationAirport: string
  departureDate?: string
  returnDate?: string
  adults?: number
}): string {
  const { originAirport, destinationAirport, departureDate, returnDate, adults = 1 } = params

  // Base KAYAK URL
  const baseUrl = 'https://www.kayak.com/flights'

  // Format dates (YYYY-MM-DD)
  const departure = departureDate || ''
  const returnD = returnDate || ''

  // Build search path
  const searchPath = `${originAirport}-${destinationAirport}/${departure}/${returnD}/${adults}adults`

  const queryParams = new URLSearchParams({
    sort: 'bestflight_a',
    // TODO: Add actual KAYAK affiliate ID when you have one
    // a: 'YOUR_KAYAK_AFFILIATE_ID'
  })

  return `${baseUrl}/${searchPath}?${queryParams.toString()}`
}

/**
 * Build Google Flights affiliate link
 *
 * @param params - Search parameters
 * @returns Affiliate URL
 */
export function buildGoogleFlightsLink(params: {
  originAirport: string
  destinationAirport: string
  departureDate?: string
  returnDate?: string
  adults?: number
}): string {
  const { originAirport, destinationAirport, departureDate, returnDate, adults = 1 } = params

  const baseUrl = 'https://www.google.com/travel/flights'

  // Build search parameters
  const queryParams = new URLSearchParams()

  // Flight search
  queryParams.set('hl', 'en')  // Language
  queryParams.set('curr', 'USD')  // Currency

  // Origin and destination
  queryParams.set('tfs', [
    `f.0.${originAirport}`,
    `t.0.${destinationAirport}`,
    departureDate ? `d.0.${departureDate}` : '',
    returnDate ? `f.1.${destinationAirport}` : '',
    returnDate ? `t.1.${originAirport}` : '',
    returnDate ? `d.1.${returnDate}` : '',
  ].filter(Boolean).join('.'))

  // Passengers
  if (adults > 1) {
    queryParams.set('passengers', adults.toString())
  }

  return `${baseUrl}?${queryParams.toString()}`
}

/**
 * Handle affiliate link click with tracking
 *
 * @param partner - Affiliate partner
 * @param searchParams - Flight search parameters
 * @param destinationId - Destination ID (optional)
 * @param sessionId - User session ID (optional)
 * @returns void (opens link in new tab)
 */
export async function handleAffiliateClick(
  partner: AffiliatePartner,
  searchParams: {
    originAirport: string
    destinationAirport: string
    departureDate?: string
    returnDate?: string
    adults?: number
  },
  destinationId?: string,
  sessionId?: string
): Promise<void> {
  // Build affiliate link based on partner
  let affiliateUrl: string

  switch (partner) {
    case 'skyscanner':
      affiliateUrl = buildSkyscannerLink(searchParams)
      break
    case 'kayak':
      affiliateUrl = buildKayakLink(searchParams)
      break
    case 'google_flights':
      affiliateUrl = buildGoogleFlightsLink(searchParams)
      break
    default:
      console.error('[Affiliate Tracking] Unknown partner:', partner)
      return
  }

  // Track click (async, don't wait)
  trackAffiliateClick({
    partner,
    clickUrl: affiliateUrl,
    destinationId,
    originAirport: searchParams.originAirport,
    destinationAirport: searchParams.destinationAirport,
    sessionId
  }).catch(err => {
    console.error('[Affiliate Tracking] Failed to track click:', err)
  })

  // Open affiliate link in new tab
  window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
}
