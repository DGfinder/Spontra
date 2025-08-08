import { getAmadeusClient, FlightSearchParams, DestinationSearchParams, AmadeusError, AmadeusClient } from '@/lib/amadeus'
import { DestinationRecommendation } from './apiClient'
import { enableMockFallbacks, getErrorMessage, ErrorType } from '@/lib/environment'

export interface AmadeusFlightOffer {
  id: string
  oneWay: boolean
  lastTicketingDate: string
  numberOfBookableSeats: number
  itineraries: AmadeusItinerary[]
  price: AmadeusPrice
  pricingOptions: AmadeusPricingOptions
  validatingAirlineCodes: string[]
  travelerPricings: AmadeusTravelerPricing[]
}

export interface AmadeusItinerary {
  duration: string
  segments: AmadeusSegment[]
}

export interface AmadeusSegment {
  departure: AmadeusEndpoint
  arrival: AmadeusEndpoint
  carrierCode: string
  number: string
  aircraft: AmadeusAircraft
  operating?: AmadeusOperating
  duration: string
  id: string
  numberOfStops: number
  blacklistedInEU: boolean
}

export interface AmadeusEndpoint {
  iataCode: string
  terminal?: string
  at: string
}

export interface AmadeusAircraft {
  code: string
}

export interface AmadeusOperating {
  carrierCode: string
}

export interface AmadeusPrice {
  currency: string
  total: string
  base: string
  fees: AmadeusFee[]
  grandTotal: string
}

export interface AmadeusFee {
  amount: string
  type: string
}

export interface AmadeusPricingOptions {
  fareType: string[]
  includedCheckedBagsOnly: boolean
}

export interface AmadeusTravelerPricing {
  travelerId: string
  fareOption: string
  travelerType: string
  price: AmadeusPrice
  fareDetailsBySegment: AmadeusFareDetails[]
}

export interface AmadeusFareDetails {
  segmentId: string
  cabin: string
  fareBasis: string
  class: string
  includedCheckedBags: AmadeusCheckedBags
}

export interface AmadeusCheckedBags {
  quantity: number
}

export interface AmadeusDestination {
  type: string
  subtype: string
  name: string
  iataCode: string
  address: AmadeusAddress
  geoCode: AmadeusGeoCode
  analytics: AmadeusAnalytics
}

export interface AmadeusAddress {
  cityName: string
  cityCode: string
  countryName: string
  countryCode: string
  regionCode: string
}

export interface AmadeusGeoCode {
  latitude: number
  longitude: number
}

export interface AmadeusAnalytics {
  travelers: AmadeusTravelers
}

export interface AmadeusTravelers {
  score: number
}

export interface AmadeusLocationSearchResult {
  type: string
  subType: string
  name: string
  detailedName: string
  id: string
  self: {
    href: string
    methods: string[]
  }
  timeZoneOffset: string
  iataCode: string
  geoCode: AmadeusGeoCode
  address: AmadeusAddress
  analytics: AmadeusAnalytics
}

class AmadeusService {
  private client: AmadeusClient | null = null
  
  private getClient(): AmadeusClient | null {
    if (!this.client) {
      try {
        this.client = getAmadeusClient()
      } catch (error) {
        console.warn('Amadeus client initialization failed:', error)
        return null
      }
    }
    return this.client
  }

  // Search for flights between specific destinations
  async searchFlights(params: FlightSearchParams): Promise<AmadeusFlightOffer[]> {
    const client = this.getClient()
    if (!client) {
      if (enableMockFallbacks) {
        console.warn('Amadeus client not available, returning mock flight data')
        return this.getMockFlightOffers(params)
      }
      throw new Error('Flight search service is unavailable')
    }
    
    try {
      const response = await client.searchFlights(params) as any
      return response.data || []
    } catch (error) {
      console.error('Flight search failed:', error)
      if (enableMockFallbacks) {
        console.warn('Falling back to mock flight data')
        return this.getMockFlightOffers(params)
      }
      throw getErrorMessage(error, 'Flight search').message
    }
  }

  // Search for destination inspiration
  async searchDestinations(params: DestinationSearchParams): Promise<AmadeusDestination[]> {
    const client = this.getClient()
    if (!client) {
      if (enableMockFallbacks) {
        console.warn('Amadeus client not available, returning mock destination data')
        return this.getMockAmadeusDestinations(params.origin)
      }
      throw new Error('Destination search service is unavailable')
    }
    
    try {
      const response = await client.searchDestinations(params) as any
      return response.data || []
    } catch (error) {
      console.error('Destination search failed:', error)
      if (enableMockFallbacks) {
        console.warn('Falling back to mock destination data')
        return this.getMockAmadeusDestinations(params.origin)
      }
      throw getErrorMessage(error, 'Destination search').message
    }
  }

  // Search for airports and cities
  async searchLocations(keyword: string, subType?: 'AIRPORT' | 'CITY'): Promise<AmadeusLocationSearchResult[]> {
    const client = this.getClient()
    if (!client) {
      if (enableMockFallbacks) {
        console.warn('Amadeus client not available, returning mock location data')
        return this.getMockLocations(keyword, subType)
      }
      throw new Error('Location search service is unavailable')
    }
    
    try {
      const response = await client.searchLocations(keyword, subType) as any
      return response.data || []
    } catch (error) {
      console.error('Location search failed:', error)
      if (enableMockFallbacks) {
        console.warn('Falling back to mock location data')
        return this.getMockLocations(keyword, subType)
      }
      throw getErrorMessage(error, 'Location search').message
    }
  }

  // Get detailed airport information
  async getAirportInfo(iataCode: string): Promise<AmadeusLocationSearchResult> {
    const client = this.getClient()
    if (!client) {
      if (enableMockFallbacks) {
        console.warn('Amadeus client not available, returning mock airport info')
        return this.getMockAirportInfo(iataCode)
      }
      throw new Error('Airport information service is unavailable')
    }
    
    try {
      const response = await client.getAirportInfo(iataCode) as any
      return response.data
    } catch (error) {
      console.error('Airport info fetch failed:', error)
      if (enableMockFallbacks) {
        console.warn('Falling back to mock airport info')
        return this.getMockAirportInfo(iataCode)
      }
      throw getErrorMessage(error, 'Airport information').message
    }
  }

  // Convert Amadeus destinations to Spontra format
  convertToDestinationRecommendations(
    amadeusDestinations: AmadeusDestination[],
    originAirport: string,
    theme: string
  ): DestinationRecommendation[] {
    return amadeusDestinations.map((dest, index) => ({
      destination: {
        id: dest.iataCode,
        airport_code: dest.iataCode,
        city_name: dest.address.cityName,
        country_name: dest.address.countryName,
        country_code: dest.address.countryCode,
        description: `Discover ${dest.address.cityName} and experience amazing ${theme} activities`,
        image_url: '',
        activities: [],
        popularity_score: dest.analytics?.travelers?.score || 75,
        climate_info: {
          average_temperature: '15-25°C',
          rainy_months: [],
          sunny_months: [],
          climate_type: 'Temperate'
        },
        best_time_to_visit: [],
        budget: {
          level: 'mid-range',
          daily_budget_range: '€100-200',
          currency: 'EUR'
        },
        timezone: 'Europe/London',
        language: ['English'],
        currency: 'EUR',
        visa_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      flight_route: {
        id: `${originAirport}-${dest.iataCode}`,
        origin_airport_code: originAirport,
        destination_airport_code: dest.iataCode,
        estimated_duration_hours: 2, // TODO: Calculate from flight data
        estimated_duration_minutes: 30,
        total_duration_minutes: 150,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      match_score: Math.min(85 + index * 2, 98),
      activity_matches: [theme] as any,
      reason_for_recommendation: `Perfect destination for ${theme} enthusiasts`,
      estimated_flight_price: '€150-300'
    }))
  }

  // Enhanced destination search with better error handling and caching
  async exploreDestinations(params: {
    origin: string
    maxFlightTime?: number
    theme: string
    departureDate?: string
  }): Promise<DestinationRecommendation[]> {
    try {
      // Build Amadeus search parameters
      const searchParams: DestinationSearchParams = {
        origin: params.origin,
        maxFlightTime: params.maxFlightTime,
        departureDate: params.departureDate || new Date().toISOString().split('T')[0],
        oneWay: true,
        viewBy: 'DESTINATION'
      }

      // Search destinations using Amadeus
      const destinations = await this.searchDestinations(searchParams)
      
      // Convert to Spontra format
      const recommendations = this.convertToDestinationRecommendations(
        destinations,
        params.origin,
        params.theme
      )

      // Sort by relevance score
      return recommendations.sort((a, b) => b.match_score - a.match_score)

    } catch (error) {
      console.error('Explore destinations failed:', error)
      
      // Fallback to mock data if Amadeus fails
      console.log('Falling back to mock data due to Amadeus API error')
      return this.getMockDestinations(params.origin, params.theme)
    }
  }

  // Mock flight offers for when Amadeus API is unavailable
  private getMockFlightOffers(params: FlightSearchParams): AmadeusFlightOffer[] {
    return [
      {
        id: 'mock-flight-1',
        oneWay: true,
        lastTicketingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        numberOfBookableSeats: 4,
        itineraries: [
          {
            duration: 'PT2H30M',
            segments: [
              {
                departure: { iataCode: params.origin, at: '2024-01-15T10:00:00' },
                arrival: { iataCode: params.destination, at: '2024-01-15T12:30:00' },
                carrierCode: 'BA',
                number: '123',
                aircraft: { code: '320' },
                duration: 'PT2H30M',
                id: '1',
                numberOfStops: 0,
                blacklistedInEU: false
              }
            ]
          }
        ],
        price: {
          currency: 'EUR',
          total: '250.00',
          base: '200.00',
          fees: [],
          grandTotal: '250.00'
        },
        pricingOptions: {
          fareType: ['PUBLISHED'],
          includedCheckedBagsOnly: true
        },
        validatingAirlineCodes: ['BA'],
        travelerPricings: [
          {
            travelerId: '1',
            fareOption: 'STANDARD',
            travelerType: 'ADULT',
            price: {
              currency: 'EUR',
              total: '250.00',
              base: '200.00',
              fees: [],
              grandTotal: '250.00'
            },
            fareDetailsBySegment: [
              {
                segmentId: '1',
                cabin: 'ECONOMY',
                fareBasis: 'KLRUKLR',
                class: 'K',
                includedCheckedBags: { quantity: 1 }
              }
            ]
          }
        ]
      }
    ]
  }

  // Mock locations for when Amadeus API is unavailable
  private getMockLocations(keyword: string, subType?: 'AIRPORT' | 'CITY'): AmadeusLocationSearchResult[] {
    const mockLocations = [
      {
        type: 'location',
        subType: subType || 'AIRPORT',
        name: `${keyword} Airport`,
        detailedName: `${keyword} International Airport`,
        id: `${keyword}-airport`,
        self: { href: '', methods: [] },
        timeZoneOffset: '+01:00',
        iataCode: keyword.toUpperCase(),
        geoCode: { latitude: 40.4168, longitude: -3.7038 },
        address: {
          cityName: keyword,
          cityCode: keyword.toUpperCase(),
          countryName: 'Spain',
          countryCode: 'ES',
          regionCode: 'MD'
        },
        analytics: { travelers: { score: 85 } }
      }
    ]
    return mockLocations
  }

  // Mock airport info for when Amadeus API is unavailable
  private getMockAirportInfo(iataCode: string): AmadeusLocationSearchResult {
    return {
      type: 'location',
      subType: 'AIRPORT',
      name: `${iataCode} Airport`,
      detailedName: `${iataCode} International Airport`,
      id: `${iataCode}-airport`,
      self: { href: '', methods: [] },
      timeZoneOffset: '+01:00',
      iataCode,
      geoCode: { latitude: 40.4168, longitude: -3.7038 },
      address: {
        cityName: iataCode,
        cityCode: iataCode,
        countryName: 'Spain',
        countryCode: 'ES',
        regionCode: 'MD'
      },
      analytics: { travelers: { score: 85 } }
    }
  }

  // Mock Amadeus destinations for when Amadeus API is unavailable
  private getMockAmadeusDestinations(origin: string): AmadeusDestination[] {
    return [
      {
        type: 'location',
        subtype: 'CITY',
        name: 'Barcelona',
        iataCode: 'BCN',
        address: {
          cityName: 'Barcelona',
          cityCode: 'BCN',
          countryName: 'Spain',
          countryCode: 'ES',
          regionCode: 'MD'
        },
        geoCode: { latitude: 41.3851, longitude: 2.1734 },
        analytics: { travelers: { score: 90 } }
      },
      {
        type: 'location',
        subtype: 'CITY',
        name: 'Rome',
        iataCode: 'ROM',
        address: {
          cityName: 'Rome',
          cityCode: 'ROM',
          countryName: 'Italy',
          countryCode: 'IT',
          regionCode: 'RM'
        },
        geoCode: { latitude: 41.9028, longitude: 12.4964 },
        analytics: { travelers: { score: 88 } }
      },
      {
        type: 'location',
        subtype: 'CITY',
        name: 'Paris',
        iataCode: 'PAR',
        address: {
          cityName: 'Paris',
          cityCode: 'PAR',
          countryName: 'France',
          countryCode: 'FR',
          regionCode: 'IDF'
        },
        geoCode: { latitude: 48.8566, longitude: 2.3522 },
        analytics: { travelers: { score: 92 } }
      }
    ]
  }

  // Fallback mock data for when Amadeus API is unavailable
  private getMockDestinations(origin: string, theme: string): DestinationRecommendation[] {
    const mockDestinations = [
      {
        iataCode: 'BCN',
        cityName: 'Barcelona',
        countryName: 'Spain',
        countryCode: 'ES'
      },
      {
        iataCode: 'ROM',
        cityName: 'Rome',
        countryName: 'Italy',
        countryCode: 'IT'
      },
      {
        iataCode: 'PAR',
        cityName: 'Paris',
        countryName: 'France',
        countryCode: 'FR'
      }
    ]

    return mockDestinations.map((dest, index) => ({
      destination: {
        id: dest.iataCode,
        airport_code: dest.iataCode,
        city_name: dest.cityName,
        country_name: dest.countryName,
        country_code: dest.countryCode,
        description: `Experience ${dest.cityName} and discover amazing ${theme} activities`,
        image_url: '',
        activities: [],
        popularity_score: 85 - index * 5,
        climate_info: {
          average_temperature: '15-25°C',
          rainy_months: [],
          sunny_months: [],
          climate_type: 'Temperate'
        },
        best_time_to_visit: [],
        budget: {
          level: 'mid-range',
          daily_budget_range: '€100-200',
          currency: 'EUR'
        },
        timezone: 'Europe/London',
        language: ['English'],
        currency: 'EUR',
        visa_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      flight_route: {
        id: `${origin}-${dest.iataCode}`,
        origin_airport_code: origin,
        destination_airport_code: dest.iataCode,
        estimated_duration_hours: 2,
        estimated_duration_minutes: 30,
        total_duration_minutes: 150,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      match_score: 88 - index * 3,
      activity_matches: [theme] as any,
      reason_for_recommendation: `Perfect for ${theme} activities`,
      estimated_flight_price: '€200-400'
    }))
  }
}

// Singleton instance
export const amadeusService = new AmadeusService()