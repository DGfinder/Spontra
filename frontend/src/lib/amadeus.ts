/**
 * Amadeus API Client
 *
 * Rate Limits (Free Tier):
 * - 2 requests/second
 * - 2000 requests/month
 *
 * Strategy: Aggressive caching + token reuse
 */

// Load environment variables (for standalone scripts)
import { config } from 'dotenv'
import { resolve } from 'path'
if (process.env.NODE_ENV !== 'production' && !process.env.AMADEUS_CLIENT_ID) {
  config({ path: resolve(process.cwd(), '.env.local') })
}

import axios, { AxiosError } from 'axios'

// ============================================================================
// Types
// ============================================================================

export interface AmadeusToken {
  value: string
  expiresAt: number  // Unix timestamp
}

export interface FlightSearchParams {
  origin: string              // IATA code (e.g., 'LAX')
  destination: string         // IATA code (e.g., 'JFK')
  departureDate: string       // YYYY-MM-DD
  adults: number              // Number of adult passengers
  returnDate?: string         // Optional return date
  currencyCode?: string       // Default: 'USD'
  max?: number                // Max results (default: 50)
}

export interface FlightOffer {
  id: string
  price: {
    total: string
    currency: string
  }
  itineraries: Array<{
    duration: string          // ISO 8601 duration (e.g., 'PT5H30M')
    segments: Array<{
      departure: {
        iataCode: string
        at: string            // ISO 8601 datetime
      }
      arrival: {
        iataCode: string
        at: string
      }
      carrierCode: string
      number: string
      duration: string
    }>
  }>
  numberOfBookableSeats: number
  validatingAirlineCodes: string[]
}

export interface AmadeusSearchResponse {
  data: FlightOffer[]
  meta: {
    count: number
  }
  dictionaries: {
    carriers: Record<string, string>
    aircraft: Record<string, string>
    currencies: Record<string, string>
    locations: Record<string, any>
  }
}

export interface AmadeusError {
  code: number
  title: string
  detail: string
  status: number
}

// ============================================================================
// Configuration
// ============================================================================

const AMADEUS_BASE_URL = process.env.AMADEUS_ENVIRONMENT === 'test'
  ? 'https://test.api.amadeus.com'
  : 'https://api.amadeus.com'
const TOKEN_BUFFER_MS = 60000 // Refresh 1min before expiration

// In-memory token cache (serverless-safe - per function invocation)
let tokenCache: AmadeusToken | null = null

// ============================================================================
// Authentication
// ============================================================================

/**
 * Get OAuth2 access token (cached)
 * Tokens are valid for ~30 minutes, we cache until 1min before expiration
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    console.log('[Amadeus] Using cached token')
    return tokenCache.value
  }

  console.log('[Amadeus] Fetching new access token')

  try {
    const response = await axios.post(
      `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const { access_token, expires_in } = response.data

    // Cache token with buffer
    tokenCache = {
      value: access_token,
      expiresAt: Date.now() + (expires_in * 1000) - TOKEN_BUFFER_MS
    }

    console.log('[Amadeus] Token cached, expires in', expires_in, 'seconds')
    return access_token

  } catch (error) {
    console.error('[Amadeus] Authentication failed:', error)

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      throw new Error(
        `Amadeus authentication failed: ${axiosError.response?.status} - ${axiosError.message}`
      )
    }

    throw new Error('Amadeus authentication failed with unknown error')
  }
}

// ============================================================================
// Flight Search
// ============================================================================

/**
 * Search for flight offers
 *
 * @throws Error if API call fails or rate limited
 */
export async function searchFlights(
  params: FlightSearchParams
): Promise<AmadeusSearchResponse> {
  const token = await getAccessToken()

  console.log('[Amadeus] Searching flights:', params)

  try {
    const response = await axios.get<AmadeusSearchResponse>(
      `${AMADEUS_BASE_URL}/v2/shopping/flight-offers`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          originLocationCode: params.origin,
          destinationLocationCode: params.destination,
          departureDate: params.departureDate,
          adults: params.adults,
          returnDate: params.returnDate,
          currencyCode: params.currencyCode || 'USD',
          max: params.max || 50
        }
      }
    )

    console.log(`[Amadeus] Found ${response.data.data.length} offers`)
    return response.data

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ errors: AmadeusError[] }>
      const status = axiosError.response?.status
      const amadeusErrors = axiosError.response?.data?.errors

      // Rate limiting (429)
      if (status === 429) {
        console.error('[Amadeus] Rate limited (429)')
        throw new Error(
          'RATE_LIMITED: Amadeus API rate limit exceeded. Please try again in a few seconds.'
        )
      }

      // Authentication error (401)
      if (status === 401) {
        console.error('[Amadeus] Unauthorized (401) - invalidating token cache')
        tokenCache = null  // Force token refresh on next request
        throw new Error('UNAUTHORIZED: Amadeus authentication expired. Please retry.')
      }

      // Validation errors (400)
      if (status === 400 && amadeusErrors) {
        const errorMessages = amadeusErrors
          .map(e => `${e.title}: ${e.detail}`)
          .join('; ')
        throw new Error(`VALIDATION_ERROR: ${errorMessages}`)
      }

      // Server errors (500+)
      if (status && status >= 500) {
        console.error('[Amadeus] Server error:', status)
        throw new Error(
          `SERVER_ERROR: Amadeus API server error (${status}). Please try again later.`
        )
      }

      // Generic error
      throw new Error(
        `API_ERROR: Amadeus API call failed with status ${status}: ${axiosError.message}`
      )
    }

    // Unknown error
    console.error('[Amadeus] Unknown error:', error)
    throw new Error('UNKNOWN_ERROR: Flight search failed with unknown error')
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse ISO 8601 duration to minutes
 * Example: 'PT5H30M' → 330 minutes
 */
export function parseDurationToMinutes(isoDuration: string): number {
  const hoursMatch = isoDuration.match(/(\d+)H/)
  const minutesMatch = isoDuration.match(/(\d+)M/)

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0

  return hours * 60 + minutes
}

/**
 * Format minutes to human-readable duration
 * Example: 330 → '5h 30m'
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

/**
 * Extract cheapest offer from search results
 */
export function getCheapestOffer(response: AmadeusSearchResponse): FlightOffer | null {
  if (!response.data || response.data.length === 0) {
    return null
  }

  return response.data.reduce((cheapest, current) => {
    const currentPrice = parseFloat(current.price.total)
    const cheapestPrice = parseFloat(cheapest.price.total)

    return currentPrice < cheapestPrice ? current : cheapest
  })
}

/**
 * Calculate total flight duration (all segments)
 */
export function getTotalDuration(offer: FlightOffer): number {
  const totalMinutes = offer.itineraries.reduce((acc, itinerary) => {
    return acc + parseDurationToMinutes(itinerary.duration)
  }, 0)

  return totalMinutes
}
