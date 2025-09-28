/**
 * Resilient Amadeus API Client with Circuit Breaker
 * Provides fault-tolerant integration with circuit breaker protection
 */

import { withCircuitBreaker, CallResult } from '@/lib/circuitBreaker'
import { trackExternalAPI } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  children?: number
  infants?: number
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  currencyCode?: string
  maxPrice?: number
  excludedAirlines?: string[]
  includedAirlines?: string[]
  nonStop?: boolean
  maxFlightTime?: number
}

export interface FlightOffer {
  id: string
  price: {
    total: string
    currency: string
    base?: string
    fees?: Array<{ amount: string; type: string }>
    grandTotal: string
  }
  itineraries: Array<{
    duration: string
    segments: Array<{
      departure: {
        iataCode: string
        terminal?: string
        at: string
      }
      arrival: {
        iataCode: string
        terminal?: string
        at: string
      }
      carrierCode: string
      number: string
      aircraft: {
        code: string
      }
      operating?: {
        carrierCode: string
      }
      duration: string
      id: string
      numberOfStops: number
      blacklistedInEU: boolean
    }>
  }>
  price_ranking?: number
  validatingAirlineCodes: string[]
  travelerPricings: Array<{
    travelerId: string
    fareOption: string
    travelerType: 'ADULT' | 'CHILD' | 'INFANT'
    price: {
      currency: string
      total: string
      base: string
    }
  }>
  choiceProbability?: string
  provider: 'amadeus'
  searchMeta: {
    requestId: string
    timestamp: string
    cached: boolean
  }
}

export interface FlightSearchResponse {
  offers: FlightOffer[]
  meta: {
    count: number
    links?: {
      self: string
      next?: string
      previous?: string
    }
  }
  dictionaries?: {
    locations: Record<string, any>
    aircraft: Record<string, any>
    currencies: Record<string, any>
    carriers: Record<string, any>
  }
  warnings?: Array<{
    code: string
    title: string
    detail: string
  }>
}

export interface AmadeusError {
  code: string
  title: string
  detail: string
  status: number
  source?: {
    pointer?: string
    parameter?: string
  }
}

class AmadeusResilientClient {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string
  private accessToken?: string
  private tokenExpiry?: Date

  constructor() {
    this.apiKey = process.env.AMADEUS_CLIENT_ID || ''
    this.apiSecret = process.env.AMADEUS_CLIENT_SECRET || ''
    this.baseUrl = process.env.AMADEUS_BASE_URL || 'https://api.amadeus.com'

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Amadeus API credentials not configured')
    }
  }

  /**
   * Search for flights with circuit breaker protection
   */
  async searchFlights(
    params: FlightSearchParams,
    correlationId?: string
  ): Promise<CallResult<FlightSearchResponse>> {
    return withCircuitBreaker(
      'amadeus',
      async () => {
        // Ensure we have a valid access token
        await this.ensureValidToken()

        const searchParams = this.buildFlightSearchParams(params)
        const url = `${this.baseUrl}/v2/shopping/flight-offers`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Spontra/1.0 (+https://spontra.com)',
            ...(correlationId && { 'X-Correlation-ID': correlationId })
          },
          signal: AbortSignal.timeout(15000) // 15 second timeout
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw this.createAmadeusError(response.status, errorData)
        }

        const data = await response.json()
        
        // Transform response to our format
        const transformedResponse: FlightSearchResponse = {
          offers: data.data?.map((offer: any) => this.transformFlightOffer(offer, correlationId)) || [],
          meta: {
            count: data.meta?.count || 0,
            links: data.meta?.links
          },
          dictionaries: data.dictionaries,
          warnings: data.warnings
        }

        return transformedResponse
      },
      // Fallback function - return cached or alternative data
      async () => {
        console.log('Using Amadeus fallback for flight search')
        
        return this.getFallbackFlightData(params, correlationId)
      },
      {
        operationName: 'search_flights',
        correlationId,
        metadata: { 
          origin: params.origin, 
          destination: params.destination,
          passengers: params.adults
        }
      }
    )
  }

  /**
   * Get airport suggestions with circuit breaker protection
   */
  async searchAirports(
    query: string,
    correlationId?: string
  ): Promise<CallResult<any[]>> {
    return withCircuitBreaker(
      'amadeus',
      async () => {
        await this.ensureValidToken()

        const url = `${this.baseUrl}/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(query)}&page[limit]=10`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            ...(correlationId && { 'X-Correlation-ID': correlationId })
          },
          signal: AbortSignal.timeout(8000) // 8 second timeout
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw this.createAmadeusError(response.status, errorData)
        }

        const data = await response.json()
        return data.data || []
      },
      // Fallback to local airport data
      async () => {
        console.log('Using airport search fallback')
        return this.getFallbackAirportData(query)
      },
      {
        operationName: 'search_airports',
        correlationId,
        metadata: { query }
      }
    )
  }

  /**
   * Get flight inspiration with circuit breaker protection
   */
  async getFlightInspiration(
    origin: string,
    maxPrice?: number,
    correlationId?: string
  ): Promise<CallResult<any[]>> {
    return withCircuitBreaker(
      'amadeus',
      async () => {
        await this.ensureValidToken()

        let url = `${this.baseUrl}/v1/shopping/flight-destinations?origin=${origin}`
        if (maxPrice) {
          url += `&maxPrice=${maxPrice}`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            ...(correlationId && { 'X-Correlation-ID': correlationId })
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw this.createAmadeusError(response.status, errorData)
        }

        const data = await response.json()
        return data.data || []
      },
      // Fallback to popular destinations
      async () => {
        console.log('Using flight inspiration fallback')
        return this.getFallbackInspirationData(origin)
      },
      {
        operationName: 'flight_inspiration',
        correlationId,
        metadata: { origin, maxPrice }
      }
    )
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return // Token is still valid
    }

    await this.getAccessToken()
  }

  /**
   * Get OAuth access token from Amadeus
   */
  private async getAccessToken(): Promise<void> {
    const url = `${this.baseUrl}/v1/security/oauth2/token`
    
    const body = new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': this.apiKey,
      'client_secret': this.apiSecret
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(`Failed to get Amadeus access token: ${response.status} ${errorData?.error_description || response.statusText}`)
    }

    const data = await response.json()
    
    this.accessToken = data.access_token
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - 60000) // Refresh 1 minute early
  }

  /**
   * Build flight search parameters for Amadeus API
   */
  private buildFlightSearchParams(params: FlightSearchParams): URLSearchParams {
    const searchParams = new URLSearchParams({
      'originLocationCode': params.origin,
      'destinationLocationCode': params.destination,
      'departureDate': params.departureDate,
      'adults': params.adults.toString()
    })

    if (params.returnDate) {
      searchParams.append('returnDate', params.returnDate)
    }

    if (params.children) {
      searchParams.append('children', params.children.toString())
    }

    if (params.infants) {
      searchParams.append('infants', params.infants.toString())
    }

    if (params.travelClass) {
      searchParams.append('travelClass', params.travelClass)
    }

    if (params.currencyCode) {
      searchParams.append('currencyCode', params.currencyCode)
    }

    if (params.maxPrice) {
      searchParams.append('maxPrice', params.maxPrice.toString())
    }

    if (params.nonStop) {
      searchParams.append('nonStop', 'true')
    }

    if (params.includedAirlines?.length) {
      searchParams.append('includedAirlineCodes', params.includedAirlines.join(','))
    }

    if (params.excludedAirlines?.length) {
      searchParams.append('excludedAirlineCodes', params.excludedAirlines.join(','))
    }

    searchParams.append('max', '50') // Limit results

    return searchParams
  }

  /**
   * Transform Amadeus flight offer to our format
   */
  private transformFlightOffer(offer: any, correlationId?: string): FlightOffer {
    return {
      id: offer.id,
      price: {
        total: offer.price.total,
        currency: offer.price.currency,
        base: offer.price.base,
        fees: offer.price.fees || [],
        grandTotal: offer.price.grandTotal
      },
      itineraries: offer.itineraries,
      validatingAirlineCodes: offer.validatingAirlineCodes,
      travelerPricings: offer.travelerPricings,
      choiceProbability: offer.choiceProbability,
      provider: 'amadeus',
      searchMeta: {
        requestId: correlationId || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        cached: false
      }
    }
  }

  /**
   * Create standardized Amadeus error
   */
  private createAmadeusError(status: number, errorData?: any): AmadeusError {
    const errors = errorData?.errors || [{ 
      code: `HTTP_${status}`, 
      title: 'API Error', 
      detail: 'Amadeus API request failed' 
    }]
    
    const primaryError = errors[0]
    
    return {
      code: primaryError.code,
      title: primaryError.title,
      detail: primaryError.detail,
      status,
      source: primaryError.source
    }
  }

  /**
   * Get fallback flight data when Amadeus is unavailable
   */
  private async getFallbackFlightData(
    params: FlightSearchParams, 
    correlationId?: string
  ): Promise<FlightSearchResponse> {
    // In a real implementation, this would query local cache or alternative providers
    console.log(`Providing fallback flight data for ${params.origin}-${params.destination}`)
    
    return {
      offers: [],
      meta: {
        count: 0
      },
      warnings: [{
        code: 'FALLBACK_DATA',
        title: 'Service Temporarily Unavailable',
        detail: 'Flight search is temporarily unavailable. Please try again later.'
      }]
    }
  }

  /**
   * Get fallback airport data when Amadeus is unavailable
   */
  private async getFallbackAirportData(query: string): Promise<any[]> {
    // Return cached airport data or empty array
    console.log(`Providing fallback airport data for query: ${query}`)
    return []
  }

  /**
   * Get fallback inspiration data when Amadeus is unavailable
   */
  private async getFallbackInspirationData(origin: string): Promise<any[]> {
    // Return popular destinations or cached data
    console.log(`Providing fallback inspiration data for origin: ${origin}`)
    return []
  }
}

// Export singleton instance
export const amadeusResilientClient = new AmadeusResilientClient()

// Helper functions for common operations
export async function searchFlightsWithResilience(
  params: FlightSearchParams,
  correlationId?: string
): Promise<CallResult<FlightSearchResponse>> {
  return amadeusResilientClient.searchFlights(params, correlationId)
}

export async function searchAirportsWithResilience(
  query: string,
  correlationId?: string
): Promise<CallResult<any[]>> {
  return amadeusResilientClient.searchAirports(query, correlationId)
}

export async function getFlightInspirationWithResilience(
  origin: string,
  maxPrice?: number,
  correlationId?: string
): Promise<CallResult<any[]>> {
  return amadeusResilientClient.getFlightInspiration(origin, maxPrice, correlationId)
}

export default amadeusResilientClient