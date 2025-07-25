import { getAmadeusClient, FlightSearchParams, DestinationSearchParams, AmadeusError } from '@/lib/amadeus'
import { DestinationRecommendation } from './apiClient'

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
  private client = getAmadeusClient()

  // Search for flights between specific destinations
  async searchFlights(params: FlightSearchParams): Promise<AmadeusFlightOffer[]> {
    try {
      const response = await this.client.searchFlights(params)
      return response.data || []
    } catch (error) {
      console.error('Flight search failed:', error)
      throw new AmadeusError(
        'Failed to search flights',
        500,
        'FLIGHT_SEARCH_ERROR',
        error
      )
    }
  }

  // Search for destination inspiration
  async searchDestinations(params: DestinationSearchParams): Promise<AmadeusDestination[]> {
    try {
      const response = await this.client.searchDestinations(params)
      return response.data || []
    } catch (error) {
      console.error('Destination search failed:', error)
      throw new AmadeusError(
        'Failed to search destinations',
        500,
        'DESTINATION_SEARCH_ERROR',
        error
      )
    }
  }

  // Search for airports and cities
  async searchLocations(keyword: string, subType?: 'AIRPORT' | 'CITY'): Promise<AmadeusLocationSearchResult[]> {
    try {
      const response = await this.client.searchLocations(keyword, subType)
      return response.data || []
    } catch (error) {
      console.error('Location search failed:', error)
      throw new AmadeusError(
        'Failed to search locations',
        500,
        'LOCATION_SEARCH_ERROR',
        error
      )
    }
  }

  // Get detailed airport information
  async getAirportInfo(iataCode: string): Promise<AmadeusLocationSearchResult> {
    try {
      const response = await this.client.getAirportInfo(iataCode)
      return response.data
    } catch (error) {
      console.error('Airport info fetch failed:', error)
      throw new AmadeusError(
        'Failed to get airport information',
        500,
        'AIRPORT_INFO_ERROR',
        error
      )
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