// Amadeus API Configuration and Client
export interface AmadeusConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
  environment: 'test' | 'production'
}

export interface AmadeusCredentials {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  children?: number
  infants?: number
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  includedAirlineCodes?: string[]
  excludedAirlineCodes?: string[]
  nonStop?: boolean
  maxPrice?: number
  max?: number
}

export interface DestinationSearchParams {
  origin: string
  maxFlightTime?: number
  departureDate?: string
  oneWay?: boolean
  duration?: string
  nonStop?: boolean
  maxPrice?: number
  viewBy?: 'DATE' | 'DESTINATION' | 'DURATION' | 'WEEK' | 'PRICE' | 'COUNTRY'
}

export class AmadeusClient {
  private config: AmadeusConfig
  private credentials: AmadeusCredentials | null = null
  private tokenExpiryTime: number = 0

  constructor(config: AmadeusConfig) {
    this.config = config
  }

  private async authenticate(): Promise<void> {
    if (this.credentials && Date.now() < this.tokenExpiryTime) {
      return // Token is still valid
    }

    const tokenUrl = `${this.config.baseUrl}/v1/security/oauth2/token`
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Authentication failed: ${error}`)
    }

    this.credentials = await response.json()
    // Set expiry time with 5 minute buffer
    this.tokenExpiryTime = Date.now() + (this.credentials!.expires_in - 300) * 1000
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    await this.authenticate()

    const url = new URL(`${this.config.baseUrl}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.credentials!.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} ${error}`)
    }

    return response.json()
  }

  // Flight Offers Search
  async searchFlights(params: FlightSearchParams) {
    const queryParams = {
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
      children: params.children,
      infants: params.infants,
      travelClass: params.travelClass,
      includedAirlineCodes: params.includedAirlineCodes?.join(','),
      excludedAirlineCodes: params.excludedAirlineCodes?.join(','),
      nonStop: params.nonStop,
      maxPrice: params.maxPrice,
      max: params.max || 250
    }

    return this.makeRequest('/v2/shopping/flight-offers', queryParams)
  }

  // Flight Destinations (for inspiration)
  async searchDestinations(params: DestinationSearchParams) {
    const queryParams = {
      origin: params.origin,
      maxFlightTime: params.maxFlightTime,
      departureDate: params.departureDate,
      oneWay: params.oneWay,
      duration: params.duration,
      nonStop: params.nonStop,
      maxPrice: params.maxPrice,
      viewBy: params.viewBy || 'DESTINATION'
    }

    return this.makeRequest('/v1/shopping/flight-destinations', queryParams)
  }

  // Airport and City Search
  async searchLocations(keyword: string, subType?: 'AIRPORT' | 'CITY') {
    const queryParams = {
      keyword,
      subType: subType || 'AIRPORT,CITY'
    }

    return this.makeRequest('/v1/reference-data/locations', queryParams)
  }

  // Get airport information
  async getAirportInfo(iataCode: string) {
    return this.makeRequest(`/v1/reference-data/locations/${iataCode}`)
  }

  // Flight delay prediction
  async predictFlightDelay(params: {
    originLocationCode: string
    destinationLocationCode: string
    departureDate: string
    departureTime: string
    arrivalDate: string
    arrivalTime: string
    aircraftCode: string
    carrierCode: string
    flightNumber: string
    duration: string
  }) {
    return this.makeRequest('/v1/travel/predictions/flight-delay', params)
  }
}

// Configuration factory
export function createAmadeusConfig(): AmadeusConfig {
  // Prefer server-only env vars when available, fallback to public for backward compatibility
  const environment = (process.env.AMADEUS_ENVIRONMENT || process.env.NEXT_PUBLIC_AMADEUS_ENVIRONMENT || 'test') as 'test' | 'production'
  
  return {
    clientId: process.env.AMADEUS_CLIENT_ID || process.env.NEXT_PUBLIC_AMADEUS_CLIENT_ID || '',
    clientSecret: process.env.AMADEUS_CLIENT_SECRET || process.env.NEXT_PUBLIC_AMADEUS_CLIENT_SECRET || '',
    baseUrl: environment === 'production' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com',
    environment
  }
}

// Singleton instance
let amadeusClient: AmadeusClient | null = null

export function getAmadeusClient(): AmadeusClient | null {
  if (!amadeusClient) {
    const config = createAmadeusConfig()
    
    // During build time or when credentials are not available, return null
    // This allows the app to build successfully and handle the missing client at runtime
    if (!config.clientId || !config.clientSecret) {
      if (typeof window === 'undefined') {
        // During build time (server-side), just return null
        console.warn('Amadeus API credentials not available during build. Will use mock data.')
        return null
      } else {
        // In browser at runtime, throw error as this means misconfiguration
        throw new Error('Amadeus API credentials not configured. Please set NEXT_PUBLIC_AMADEUS_CLIENT_ID and NEXT_PUBLIC_AMADEUS_CLIENT_SECRET environment variables.')
      }
    }
    
    try {
      amadeusClient = new AmadeusClient(config)
    } catch (error) {
      console.warn('Failed to initialize Amadeus client:', error)
      return null
    }
  }
  
  return amadeusClient
}

// Error types for better error handling
export class AmadeusError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public detail?: any
  ) {
    super(message)
    this.name = 'AmadeusError'
  }
}

// Helper function to validate IATA codes
export function validateIATACode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code.toUpperCase())
}

// Helper function to format dates for Amadeus API
export function formatDateForAmadeus(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Helper function to parse Amadeus date
export function parseAmadeusDate(dateString: string): Date {
  return new Date(dateString)
}

// Rate limiting helper
export class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly timeWindow: number // in milliseconds

  constructor(maxRequests: number = 10, timeWindowSeconds: number = 1) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindowSeconds * 1000
  }

  async throttle(): Promise<void> {
    const now = Date.now()
    
    // Remove requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest)
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    this.requests.push(now)
  }
}