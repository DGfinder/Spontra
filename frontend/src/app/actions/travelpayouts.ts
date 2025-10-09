'use server'

import axios from 'axios'
import { db } from '@/lib/db'
import { getCachedResponse, CACHE_DURATIONS } from '@/lib/cache/travelpayouts'
import { withRetryAxios } from '@/lib/api/retry'
import {
  AviasalesSearchResponseSchema,
  V1SearchInitResponseSchema,
  V1SearchResultsResponseSchema,
  validateResponse,
  type AviasalesFlightData,
  type V1FlightProposal
} from '@/lib/validations/travelpayouts'
import { generateSearchSignature } from '@/lib/affiliate/signature'
import { headers } from 'next/headers'

// Re-export types for backwards compatibility
interface AviasalesSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
}

// Hotellook Hotel API types
interface HotellookSearchParams {
  location: string
  checkIn: string
  checkOut: string
  adults?: number
  limit?: number
}

interface HotellookHotelData {
  hotelId: string
  hotelName: string
  location: {
    lat: number
    lon: number
  }
  priceFrom: number
  stars: number
  link: string
}

/**
 * Search for cheapest flight prices using Aviasales API
 * Returns cached prices from last 48 hours of user searches
 * Features: Caching, retry logic, response validation
 */
export async function searchAviasalesFlights(params: AviasalesSearchParams) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN

    if (!token) {
      console.error('TRAVELPAYOUTS_TOKEN not configured')
      return { success: false, error: 'API not configured' }
    }

    // Cache key parameters
    const cacheParams = {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate || 'one-way'
    }

    // Fetch with caching and retry logic
    const result = await getCachedResponse(
      'prices_latest',
      cacheParams,
      async () => {
        // Retry wrapper around API call
        return await withRetryAxios(
          async () => {
            const response = await axios.get(
              'https://api.travelpayouts.com/v2/prices/latest',
              {
                params: {
                  origin: params.origin,
                  destination: params.destination,
                  beginning_of_period: params.departureDate,
                  currency: 'usd',
                  limit: 30,
                  show_to_affiliates: true,
                  sorting: 'price',
                  trip_class: 0, // Economy
                  one_way: !params.returnDate
                },
                headers: {
                  'X-Access-Token': token,
                  'Accept-Encoding': 'gzip, deflate'
                },
                timeout: 30000 // Increased to 30s
              }
            )

            return response.data
          },
          {
            maxRetries: 3,
            initialDelay: 200,
            onRetry: (attempt, error) => {
              console.log(`[Aviasales v2] Retry attempt ${attempt} for ${params.origin}-${params.destination}`)
            }
          }
        )
      },
      CACHE_DURATIONS.FLIGHTS
    )

    // v2 API returns { success: true, data: [...], currency: 'usd' }
    if (!result || !result.success || !result.data || result.data.length === 0) {
      console.log('[Aviasales v2] No flights found in response')
      return {
        success: false,
        error: 'No flights found'
      }
    }

    // Transform v2 API response to our internal format
    // v2 fields: value, trip_class, show_to_affiliates, origin, destination, gate, depart_date, return_date, number_of_changes, found_at, distance, duration, actual
    const flights = result.data.map((flight: any) => ({
      price: flight.value,
      airline: flight.airline || 'Multiple',
      flightNumber: flight.flight_number || '',
      originAirport: flight.origin,
      destinationAirport: flight.destination,
      departureTime: flight.depart_date,
      returnTime: flight.return_date || undefined,
      transfers: flight.number_of_changes || 0,
      returnTransfers: 0,
      isDirect: (flight.number_of_changes || 0) === 0,
      duration: flight.duration || 0,
      durationTo: flight.duration || 0,
      durationBack: 0,
      bookingLink: `https://www.aviasales.com/search/${flight.origin}${flight.depart_date}${flight.destination}${flight.return_date || ''}1`
    }))

    return {
      success: true,
      data: {
        flights,
        currency: result.currency || 'usd'
      }
    }
  } catch (error) {
    console.error('Aviasales API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Note: Link generation functions moved to @/lib/affiliate/travelpayouts
// to avoid Next.js 'use server' file restrictions

/**
 * Track a click to Aviasales/Travelpayouts in the database
 */
export async function trackAviasalesClick(data: {
  userId?: string
  sessionId: string
  destinationId?: string
  originAirport: string
  destinationAirport: string
  departureDate: string
  returnDate?: string
  displayedPrice?: number
  clickUrl: string
  referrer?: string
  ipAddress?: string
  userAgent?: string
  variant?: 'aviasales' | 'jetradar'
}) {
  try {
    const click = await db.affiliateClick.create({
      data: {
        userId: data.userId || null,
        sessionId: data.sessionId,
        destinationId: data.destinationId || null,
        partner: data.variant || 'aviasales',
        affiliateId: process.env.TRAVELPAYOUTS_MARKER || null,
        clickUrl: data.clickUrl,
        originAirport: data.originAirport,
        destinationAirport: data.destinationAirport,
        departureDate: data.departureDate,
        returnDate: data.returnDate || null,
        displayedPrice: data.displayedPrice || null,
        currency: 'USD',
        referrer: data.referrer || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      }
    })

    return { success: true, clickId: click.id }
  } catch (error) {
    console.error('Error tracking Aviasales click:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the cheapest flight for a route (helper function)
 */
export async function getCheapestFlight(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
}) {
  const result = await searchAviasalesFlights(params)

  if (!result.success || !result.data) {
    return null
  }

  const cheapestFlight = result.data.flights[0]
  return cheapestFlight || null
}

/**
 * Search for hotels using Hotellook API (25-35% commission!)
 * Much better margins than flights
 */
export async function searchHotels(params: HotellookSearchParams) {
  try {
    const marker = process.env.TRAVELPAYOUTS_MARKER

    if (!marker) {
      console.error('TRAVELPAYOUTS_MARKER not configured')
      return { success: false, error: 'API not configured' }
    }

    const response = await axios.get(
      'https://engine.hotellook.com/api/v2/cache.json',
      {
        params: {
          location: params.location,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          adults: params.adults || 2,
          limit: params.limit || 10,
          currency: 'USD',
          marker: marker
        },
        timeout: 10000
      }
    )

    if (!response.data || response.data.length === 0) {
      return { success: false, error: 'No hotels found' }
    }

    const hotels = response.data.slice(0, params.limit || 10).map((hotel: any) => ({
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      location: hotel.location,
      priceFrom: hotel.priceFrom,
      stars: hotel.stars,
      link: hotel.link
    }))

    return {
      success: true,
      data: { hotels }
    }
  } catch (error) {
    console.error('Hotellook API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * V1 Real-Time Flight Search (Option B)
 *
 * Uses Travelpayouts v1/flight_search API for live pricing
 * Two-step process:
 * 1. Initialize search (POST /v1/flight_search) → get search_id
 * 2. Poll for results (GET /v1/flight_search_results?uuid={search_id})
 *
 * Features:
 * - Live prices from airlines (not cached)
 * - MD5 signature authentication
 * - Polling with timeout/retry logic
 *
 * ⚠️ IMPORTANT: V1 Flight Search API requires special access/approval from Travelpayouts
 * Current credentials (free tier) only support V2/V3 Data APIs
 * Signature generation is correct but API returns 401 Unauthorized
 * For production: Request V1 API access or use V3 API (currently working)
 */
export async function searchFlightsRealtime(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
  children?: number
  infants?: number
}) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN
    const marker = process.env.TRAVELPAYOUTS_MARKER

    if (!token || !marker) {
      console.error('Travelpayouts credentials not configured')
      return { success: false, error: 'API not configured' }
    }

    // Get user IP from headers (fallback to localhost for dev)
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    let userIP = forwardedFor ? forwardedFor.split(',')[0].trim() :
                 headersList.get('x-real-ip') ||
                 '127.0.0.1'

    // Convert IPv6 localhost to IPv4
    if (userIP === '::1' || userIP === '::ffff:127.0.0.1') {
      userIP = '127.0.0.1'
    }

    // Get host from headers or environment (remove port for signature)
    const requestHost = headersList.get('host') || ''
    let host = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') ||
               requestHost ||
               'localhost'

    // Remove port from host for signature (Travelpayouts docs use domain only)
    host = host.split(':')[0]

    console.log('[Travelpayouts V1] Request details:', { host, userIP, originalHost: requestHost })

    // Build search params
    const segments = [
      {
        origin: params.origin,
        destination: params.destination,
        date: params.departureDate
      }
    ]

    // Add return segment if round trip
    if (params.returnDate) {
      segments.push({
        origin: params.destination,
        destination: params.origin,
        date: params.returnDate
      })
    }

    const searchParams = {
      marker,
      host,
      user_ip: userIP,
      locale: 'en',
      trip_class: 'Y', // Economy
      passengers: {
        adults: params.adults || 1,
        children: params.children || 0,
        infants: params.infants || 0
      },
      segments
    }

    // Generate MD5 signature
    const signature = generateSearchSignature(searchParams)

    // Step 1: Initialize search
    console.log('[Travelpayouts V1] Initializing search...')
    console.log('[Travelpayouts V1] Request payload:', JSON.stringify({ ...searchParams, signature }, null, 2))

    const initResponse = await axios.post(
      'https://api.travelpayouts.com/v1/flight_search',
      {
        ...searchParams,
        signature
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    )

    // Validate init response
    const initValidated = validateResponse(
      V1SearchInitResponseSchema,
      initResponse.data,
      'searchFlightsRealtime:init'
    )

    if (!initValidated || !initValidated.search_id) {
      return {
        success: false,
        error: 'Failed to initialize search'
      }
    }

    const searchId = initValidated.search_id
    console.log(`[Travelpayouts V1] Search initialized: ${searchId}`)

    // Step 2: Poll for results
    const maxAttempts = 30 // 30 attempts
    const pollInterval = 2000 // 2 seconds
    const maxWaitTime = 60000 // 60 seconds total

    let attempts = 0
    let startTime = Date.now()

    while (attempts < maxAttempts && (Date.now() - startTime) < maxWaitTime) {
      attempts++

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      try {
        const resultsResponse = await axios.get(
          `https://api.travelpayouts.com/v1/flight_search_results`,
          {
            params: {
              uuid: searchId,
              marker
            },
            headers: {
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        )

        // Validate results response
        const resultsValidated = validateResponse(
          V1SearchResultsResponseSchema,
          resultsResponse.data,
          'searchFlightsRealtime:results'
        )

        if (!resultsValidated) {
          console.log(`[Travelpayouts V1] Invalid response format (attempt ${attempts})`)
          continue
        }

        // Check status
        if (resultsValidated.status === 'failed') {
          return {
            success: false,
            error: resultsValidated.error || 'Search failed'
          }
        }

        if (resultsValidated.status === 'completed' && resultsValidated.proposals) {
          console.log(`[Travelpayouts V1] Search completed with ${resultsValidated.proposals.length} results`)

          // Transform proposals to our internal format
          const flights = resultsValidated.proposals.map((proposal: V1FlightProposal) => ({
            price: proposal.pricing.total,
            currency: proposal.pricing.currency,
            airline: proposal.segments[0]?.airline || '',
            flightNumber: proposal.segments.map(s => s.flight_number).join(', '),
            originAirport: params.origin,
            destinationAirport: params.destination,
            departureTime: proposal.segments[0]?.departure || '',
            returnTime: segments.length > 1 ? proposal.segments[proposal.segments.length - 1]?.arrival : undefined,
            transfers: proposal.segments.length - 1,
            isDirect: proposal.is_direct,
            duration: proposal.total_duration,
            bookingLink: proposal.booking_link,
            segments: proposal.segments
          }))

          return {
            success: true,
            data: {
              flights,
              searchId,
              totalResults: flights.length
            }
          }
        }

        // Still pending, continue polling
        console.log(`[Travelpayouts V1] Polling... (attempt ${attempts}, progress: ${resultsValidated.progress || 0}%)`)

      } catch (pollError) {
        console.error(`[Travelpayouts V1] Poll error (attempt ${attempts}):`, pollError)
        // Continue polling on transient errors
        continue
      }
    }

    // Timeout
    return {
      success: false,
      error: 'Search timeout - please try again'
    }

  } catch (error) {
    console.error('[Travelpayouts V1] Real-time search error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
