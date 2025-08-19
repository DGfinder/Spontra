import { getAmadeusClient, FlightSearchParams, DestinationSearchParams, AmadeusError, AmadeusClient } from '@/lib/amadeus'
import { DestinationRecommendation } from './apiClient'
import { enableMockFallbacks, getErrorMessage, ErrorType } from '@/lib/environment'
import { getCitiesForTheme, isThemeSupported, ThemeCity, getTopCitiesForTheme } from '@/data/themeCities'

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

  // Theme-based destination search with cached prices (RECREATES ORIGINAL SPONTRA LOGIC!)
  async exploreDestinations(params: {
    origin: string
    maxFlightTime?: number
    theme: string
    departureDate?: string
    viewBy?: 'DATE' | 'DESTINATION' | 'DURATION' | 'WEEK' | 'COUNTRY' | 'PRICE'
    nonStop?: boolean // accepted for API parity; currently advisory in theme flow
  }): Promise<DestinationRecommendation[]> {
    
    // Step 1: Check if theme is supported
    if (!isThemeSupported(params.theme)) {
      console.warn(`❌ Unsupported theme: ${params.theme}`)
      throw new Error(`Theme "${params.theme}" is not supported. Please choose from: party, adventure, learn, shopping, beach`)
    }

    // Step 2: Get curated cities for this theme (THIS IS THE KEY FIX!)
    const themeCities = getTopCitiesForTheme(params.theme, 15) // Limit to top 15 cities
    console.log(`📋 Found ${themeCities.length} curated cities for theme: ${params.theme}`)
    console.log(`🌆 Theme cities: ${themeCities.map(c => c.cityName).join(', ')}`)

    // Step 3: Filter by flight time if specified
    let filteredCities = themeCities
    if (params.maxFlightTime) {
      filteredCities = themeCities.filter(city => city.averageFlightTime <= params.maxFlightTime!)
      console.log(`✈️ After flight time filter (${params.maxFlightTime}h): ${filteredCities.length} cities`)
    }

    if (filteredCities.length === 0) {
      console.warn(`❌ No cities found for theme "${params.theme}" within ${params.maxFlightTime} hours`)
      return []
    }

    // Step 4: Get cached pricing for each theme-appropriate city
    const { amadeusClient } = await import('@/lib/amadeus-simple')
    const recommendations: DestinationRecommendation[] = []
    
    try {
      console.log('💰 Getting cached prices for theme-specific cities...')
      
      // Process cities in smaller batches to avoid overwhelming the API
      const batchSize = 5
      for (let i = 0; i < filteredCities.length; i += batchSize) {
        const batch = filteredCities.slice(i, i + batchSize)
        
        // Get flight pricing for each city in the batch
        const batchPromises = batch.map(async (city) => {
          try {
            // Try to get cached flight pricing to this specific city
            const flightDestinations = await amadeusClient.exploreDestinations({
              origin: params.origin,
              maxFlightTime: city.averageFlightTime + 2, // Add buffer
              departureDate: params.departureDate,
              viewBy: 'PRICE'
            })

            // Find flights to this specific city
            const cityFlights = flightDestinations.filter(flight => 
              flight.destination === city.iataCode
            )

            if (cityFlights.length > 0) {
              // Create recommendation with real cached price
              const bestFlight = cityFlights[0] // Already sorted by price
              return this.createThemeBasedRecommendation(city, bestFlight, params.origin, params.theme)
            } else {
              // No direct flights found, create recommendation with estimated price
              console.log(`🔄 No direct flights to ${city.cityName}, using estimated pricing`)
              return this.createThemeBasedRecommendation(city, null, params.origin, params.theme)
            }
          } catch (error) {
            console.warn(`⚠️ Error getting price for ${city.cityName}:`, error)
            // Still include city but with estimated pricing
            return this.createThemeBasedRecommendation(city, null, params.origin, params.theme)
          }
        })

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises)
        recommendations.push(...batchResults.filter(rec => rec !== null))
        
        // Small delay between batches to be API-friendly
        if (i + batchSize < filteredCities.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      console.log(`✅ Created ${recommendations.length} theme-based recommendations`)
      
      // Sort by price and theme relevance
      return recommendations.sort((a, b) => {
        const priceA = parseFloat((a.estimated_flight_price || '999').replace(/[^0-9.-]/g, ''))
        const priceB = parseFloat((b.estimated_flight_price || '999').replace(/[^0-9.-]/g, ''))
        return priceA - priceB
      })

    } catch (error) {
      console.error('Theme-based destination exploration failed:', error)
      
      // Fallback: Create recommendations from theme cities without pricing
      if (enableMockFallbacks) {
        console.log('🔄 Falling back to theme cities without real pricing')
        return filteredCities.map(city => 
          this.createThemeBasedRecommendation(city, null, params.origin, params.theme)
        ).filter(rec => rec !== null)
      }
      
      throw getErrorMessage(error, 'Theme-based destination exploration').message
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
      case 'beach':
        return ['nature', 'activities']
      default:
        return ['activities']
    }
  }

  // Create recommendation from theme city data
  private createThemeBasedRecommendation(
    city: ThemeCity, 
    flightData: any | null, 
    origin: string, 
    theme: string
  ): DestinationRecommendation {
    // Extract real price if available, otherwise estimate based on flight time
    let estimatedPrice = '€200-400' // Default fallback
    if (flightData?.price?.total) {
      estimatedPrice = `€${flightData.price.total}`
    } else {
      // Estimate price based on flight time (rough approximation)
      const basePrice = Math.round(city.averageFlightTime * 50 + 100)
      const variation = Math.round(basePrice * 0.3)
      estimatedPrice = `€${basePrice - variation}-${basePrice + variation}`
    }

    return {
      destination: {
        id: city.iataCode,
        airport_code: city.iataCode,
        city_name: city.cityName,
        country_name: city.countryName,
        country_code: city.countryCode,
        description: `${city.cityName} - ${city.highlights.join(', ')}`,
        image_url: '',
        activities: [], // Will be populated later with proper ActivityInfo objects
        popularity_score: Math.max(...Object.values(city.themeScores)), // Use highest theme score as popularity
        climate_info: {
          average_temperature: '15-25°C',
          rainy_months: [],
          sunny_months: [],
          climate_type: 'Temperate'
        },
        best_time_to_visit: [],
        budget: {
          level: 'mid-range',
          daily_budget_range: '€80-150',
          currency: 'EUR'
        },
        timezone: 'Europe/Central',
        language: ['English'],
        currency: 'EUR',
        visa_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      flight_route: {
        id: `${origin}-${city.iataCode}`,
        origin_airport_code: origin,
        destination_airport_code: city.iataCode,
        estimated_duration_hours: Math.floor(city.averageFlightTime),
        estimated_duration_minutes: Math.round((city.averageFlightTime % 1) * 60),
        total_duration_minutes: Math.round(city.averageFlightTime * 60),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      match_score: Math.min(city.themeScores[theme as keyof typeof city.themeScores] + 5, 98), // Use theme-specific score
      activity_matches: this.mapThemeToActivityTypes(theme), // Map theme to valid activity types
      reason_for_recommendation: `Perfect ${theme} destination: ${city.highlights[0]}`,
      estimated_flight_price: estimatedPrice
    }
  }

  // Convert flight-destination objects with cached prices to destination recommendations
  async convertFlightDestinationsToRecommendations(
    flightDestinations: any[],
    originAirport: string,
    theme: string
  ): Promise<DestinationRecommendation[]> {
    const { amadeusClient } = await import('@/lib/amadeus-simple')

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
        const destinationLocation = await amadeusClient.getLocationByIataCode(flightDest.destination)
        
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