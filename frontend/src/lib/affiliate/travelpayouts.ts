/**
 * Travelpayouts Affiliate Link Utilities
 * These are pure functions for generating affiliate links (not server actions)
 */

/**
 * Generate an Aviasales deep link with affiliate tracking
 */
export function generateAviasalesLink(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
}) {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || process.env.TRAVELPAYOUTS_MARKER || ''

  // Format: /search/ORIGIN{DATE}DESTINATION{RETURNDATE}?...
  const dateFormatted = params.departureDate.replace(/-/g, '')
  const returnDateFormatted = params.returnDate ? params.returnDate.replace(/-/g, '') : ''

  const searchPath = returnDateFormatted
    ? `/search/${params.origin}${dateFormatted}${params.destination}${returnDateFormatted}`
    : `/search/${params.origin}${dateFormatted}${params.destination}`

  const queryParams = new URLSearchParams({
    adults: (params.adults || 1).toString(),
    marker: marker,
    currency: 'usd'
  })

  return `https://www.aviasales.com${searchPath}?${queryParams.toString()}`
}

/**
 * Generate Jetradar link (also part of Travelpayouts network)
 */
export function generateJetradarUrl(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
}) {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || process.env.TRAVELPAYOUTS_MARKER || ''

  const searchParams = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    depart_date: params.departureDate,
    return_date: params.returnDate || '',
    marker: marker,
    currency: 'USD'
  })

  return `https://www.jetradar.com/flights?${searchParams.toString()}`
}
