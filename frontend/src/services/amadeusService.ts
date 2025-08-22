import { amadeusClient } from '@/lib/amadeusSimple'
import { DestinationRecommendation } from './apiClient'
import { getErrorMessage, ErrorType } from '@/lib/environment'

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
  // Use the SimpleAmadeusClient directly - no initialization needed
  private getClient() {
    return amadeusClient
  }

  // Search for flights between specific destinations
  async searchFlights(params: {
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
    adults?: number
    travelClass?: string
    max?: number
    nonStop?: boolean
  }): Promise<AmadeusFlightOffer[]> {
    const client = this.getClient()
    
    try {
      console.log('🔍 Searching flights with SimpleAmadeusClient:', params)
      const response = await client.searchFlights(params)
      console.log('✅ Flight search successful, found:', response?.length || 0, 'offers')
      return response || []
    } catch (error) {
      console.error('❌ Flight search failed:', error)
      throw new Error(getErrorMessage(error, 'Flight search').message)
    }
  }

  // Search for destination inspiration  
  async searchDestinations(params: {
    origin: string
    maxFlightTime?: number
    departureDate?: string
    viewBy?: 'DATE' | 'DESTINATION' | 'DURATION' | 'WEEK' | 'PRICE' | 'COUNTRY'
  }): Promise<any[]> {
    const client = this.getClient()
    
    try {
      console.log('🔍 Exploring destinations with SimpleAmadeusClient:', params)
      const response = await client.exploreDestinations(params)
      console.log('✅ Destination exploration successful, found:', response?.length || 0, 'destinations')
      return response || []
    } catch (error) {
      console.error('❌ Destination exploration failed:', error)
      throw new Error(getErrorMessage(error, 'Destination exploration').message)
    }
  }

  // Search for airports and cities
  async searchLocations(keyword: string, subType?: 'AIRPORT' | 'CITY'): Promise<any[]> {
    const client = this.getClient()
    
    try {
      console.log('🔍 Searching locations with SimpleAmadeusClient:', { keyword, subType })
      const response = await client.searchLocations(keyword, subType || 'AIRPORT')
      console.log('✅ Location search successful, found:', response?.length || 0, 'locations')
      return response || []
    } catch (error) {
      console.error('❌ Location search failed:', error)
      throw new Error(getErrorMessage(error, 'Location search').message)
    }
  }

  // Get detailed airport information
  async getAirportInfo(iataCode: string): Promise<any> {
    const client = this.getClient()
    
    try {
      console.log('🔍 Getting airport info with SimpleAmadeusClient:', iataCode)
      const response = await client.getLocationByIataCode(iataCode)
      console.log('✅ Airport info retrieval successful for:', iataCode)
      return response
    } catch (error) {
      console.error('❌ Airport info retrieval failed:', error)
      throw new Error(getErrorMessage(error, 'Airport information').message)
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

  // Direct destination exploration using Amadeus API (no theme cities)
  async exploreDestinations(params: {
    origin: string
    maxFlightTime?: number
    theme?: string
    departureDate?: string
    viewBy?: 'DATE' | 'DESTINATION' | 'DURATION' | 'WEEK' | 'COUNTRY' | 'PRICE'
    nonStop?: boolean
  }): Promise<DestinationRecommendation[]> {
    
    const client = this.getClient()
    
    try {
      console.log('🔍 Direct Amadeus destination exploration (no theme filtering):', params)
      
      // Use real Amadeus API for destination exploration
      const destinations = await client.exploreDestinations({
        origin: params.origin,
        maxFlightTime: params.maxFlightTime,
        departureDate: params.departureDate,
        viewBy: params.viewBy || 'PRICE'
      })

      console.log('✅ Direct Amadeus API success, found:', destinations?.length || 0, 'destinations')
      
      // Convert raw Amadeus destinations to recommendation format
      const recommendations = await this.convertFlightDestinationsToRecommendations(
        destinations,
        params.origin,
        params.theme || 'general'
      )

      return recommendations
    } catch (error) {
      console.error('❌ Direct destination exploration failed:', error)
      throw new Error(getErrorMessage(error, 'Destination exploration').message)
    }
  }

  // Map theme to valid ActivityType values
  private mapThemeToActivityTypes(theme: string): ('activities' | 'shopping' | 'restaurants' | 'nature' | 'culture')[] {
    switch (theme.toLowerCase()) {
      case 'party':
      case 'nightlife':
        return ['activities', 'restaurants']
      case 'adventure':
      case 'outdoor':
        return ['nature', 'activities']
      case 'learn':
      case 'culture':
        return ['culture', 'activities']
      case 'shopping':
        return ['shopping', 'activities']
      case 'nature':
        return ['nature', 'activities']
      default:
        return ['activities']
    }
  }


  // Convert flight-destination objects with cached prices to destination recommendations
  async convertFlightDestinationsToRecommendations(
    flightDestinations: any[],
    originAirport: string,
    theme: string
  ): Promise<DestinationRecommendation[]> {
    const client = this.getClient()

    const recommendations: DestinationRecommendation[] = []
    
    // Process destinations with location lookup (limit to avoid too many API calls)
    const destinationsToProcess = flightDestinations.slice(0, 20)
    
    for (let i = 0; i < destinationsToProcess.length; i++) {
      const flightDest = destinationsToProcess[i]
      
      try {
        // Extract cached price - this is the key improvement!
        const cachedPrice = flightDest.price?.total || '0'
        const currency = 'EUR' // Default, could extract from API response if available
        const formattedPrice = `€${cachedPrice}`
        
        // Get location details for the destination
        const destinationLocation = await client.getLocationByIataCode(flightDest.destination)
        
        if (!destinationLocation) {
          console.warn(`Could not find location details for ${flightDest.destination}`)
          continue
        }

        // Create recommendation with real cached price
        const recommendation: DestinationRecommendation = {
          destination: {
            id: flightDest.destination,
            airport_code: flightDest.destination,
            city_name: destinationLocation.address?.cityName || destinationLocation.name || flightDest.destination,
            country_name: destinationLocation.address?.countryName || 'Unknown',
            country_code: destinationLocation.address?.countryCode || 'XX',
            description: `Discover ${destinationLocation.address?.cityName || destinationLocation.name} and experience amazing ${theme} activities`,
            image_url: '',
            activities: [],
            popularity_score: 75,
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
              currency: currency
            },
            timezone: 'UTC+1',
            language: ['English'],
            currency: currency,
            visa_required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          flight_route: {
            id: `${originAirport}-${flightDest.destination}`,
            origin_airport_code: originAirport,
            destination_airport_code: flightDest.destination,
            estimated_duration_hours: 2,
            estimated_duration_minutes: 30,
            total_duration_minutes: 150,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          match_score: Math.max(95 - i * 2, 60), // Higher scores for cheaper flights
          activity_matches: [theme] as any,
          reason_for_recommendation: `Great value destination for ${theme} activities`,
          estimated_flight_price: formattedPrice // ✨ REAL CACHED PRICE FROM AMADEUS!
        }

        recommendations.push(recommendation)
        
        // Add small delay to be respectful to API rate limits
        if (i < destinationsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } catch (error) {
        console.error(`Error processing destination ${flightDest.destination}:`, error)
        continue
      }
    }

    console.log(`✅ Successfully converted ${recommendations.length} destinations with cached prices`)
    return recommendations
  }
}

// Singleton instance
export const amadeusService = new AmadeusService()