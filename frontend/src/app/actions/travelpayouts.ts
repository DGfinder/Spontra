'use server'

import axios from 'axios'
import { db } from '@/lib/db'

// Aviasales Flight API types
interface AviasalesSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
}

interface AviasalesFlightData {
  origin: string
  destination: string
  origin_airport: string
  destination_airport: string
  price: number
  airline: string
  flight_number: string
  departure_at: string
  return_at?: string
  transfers: number
  return_transfers?: number
  duration: number
  duration_to?: number
  duration_back?: number
  link: string
}

interface AviasalesApiResponse {
  success: boolean
  data: AviasalesFlightData[]
  currency?: string
  error?: string
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
 * Free tier: No specific rate limit
 */
export async function searchAviasalesFlights(params: AviasalesSearchParams) {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN

    if (!token) {
      console.error('TRAVELPAYOUTS_TOKEN not configured')
      return { success: false, error: 'API not configured' }
    }

    const response = await axios.get<AviasalesApiResponse>(
      'https://api.travelpayouts.com/aviasales/v3/prices_for_dates',
      {
        params: {
          origin: params.origin,
          destination: params.destination,
          departure_at: params.departureDate,
          return_at: params.returnDate || undefined,
          one_way: !params.returnDate,
          currency: 'usd',
          sorting: 'price',
          direct: false,
          limit: 10,
          page: 1,
          token: token
        },
        headers: {
          'Accept-Encoding': 'gzip, deflate' // Faster response
        },
        timeout: 10000
      }
    )

    if (!response.data.success || !response.data.data || response.data.data.length === 0) {
      return {
        success: false,
        error: response.data.error || 'No flights found'
      }
    }

    const flights = response.data.data.map((flight) => ({
      price: flight.price,
      airline: flight.airline,
      flightNumber: flight.flight_number,
      originAirport: flight.origin_airport,
      destinationAirport: flight.destination_airport,
      departureTime: flight.departure_at,
      returnTime: flight.return_at,
      transfers: flight.transfers,
      returnTransfers: flight.return_transfers || 0,
      isDirect: flight.transfers === 0,
      duration: flight.duration,
      durationTo: flight.duration_to,
      durationBack: flight.duration_back,
      bookingLink: `https://www.aviasales.com${flight.link}`
    }))

    return {
      success: true,
      data: {
        flights,
        currency: response.data.currency || 'usd'
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
  const marker = process.env.TRAVELPAYOUTS_MARKER || ''

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
 * Alternative: Generate Jetradar link (also part of Travelpayouts network)
 */
export function generateJetradarUrl(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
}) {
  const marker = process.env.TRAVELPAYOUTS_MARKER || ''

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
