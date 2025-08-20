import { DestinationRecommendation } from './apiClient'
import { getCitiesForTheme, getTopCitiesForTheme, ThemeCity } from '@/data/themeCities'

/**
 * Static fallback service for when external APIs are unavailable
 * Provides curated destination recommendations based on theme data
 */
class StaticFallbackService {
  
  /**
   * Get static destination recommendations for a theme
   */
  async getDestinationsByTheme(params: {
    origin: string
    theme: string
    maxFlightTime?: number
    maxResults?: number
  }): Promise<DestinationRecommendation[]> {
    console.log(`🔄 Using static fallback data for theme: ${params.theme}`)
    
    // Get curated cities for the theme
    let themeCities = getTopCitiesForTheme(params.theme, params.maxResults || 20)
    
    // Filter by flight time if specified
    if (params.maxFlightTime) {
      themeCities = themeCities.filter(city => city.averageFlightTime <= params.maxFlightTime!)
    }
    
    // Convert to destination recommendations
    const recommendations = themeCities.map((city, index) => 
      this.createStaticRecommendation(city, params.origin, params.theme, index)
    )
    
    console.log(`✅ Generated ${recommendations.length} static recommendations for ${params.theme}`)
    return recommendations
  }
  
  /**
   * Get static destination recommendations for popular destinations
   */
  async getPopularDestinations(origin: string, maxResults: number = 10): Promise<DestinationRecommendation[]> {
    console.log('🔄 Using static fallback data for popular destinations')
    
    // Get a mix of cities from different themes
    const popularCities = [
      ...getTopCitiesForTheme('party', 3),
      ...getTopCitiesForTheme('adventure', 3), 
      ...getTopCitiesForTheme('beach', 2),
      ...getTopCitiesForTheme('learn', 2)
    ].slice(0, maxResults)
    
    const recommendations = popularCities.map((city, index) => 
      this.createStaticRecommendation(city, origin, 'mixed', index)
    )
    
    console.log(`✅ Generated ${recommendations.length} popular destination recommendations`)
    return recommendations
  }
  
  /**
   * Get static airport information
   */
  async getAirportInfo(iataCode: string): Promise<any> {
    console.log(`🔄 Using static fallback data for airport: ${iataCode}`)
    
    // Find city in our theme data
    const allCities = getCitiesForTheme('party') // Get all cities
    const city = allCities.find(c => c.iataCode === iataCode.toUpperCase())
    
    if (city) {
      return {
        type: 'location',
        subType: 'AIRPORT',
        name: `${city.cityName} Airport`,
        detailedName: `${city.cityName} International Airport`,
        id: `${iataCode}-airport`,
        self: { href: '', methods: [] },
        timeZoneOffset: '+01:00',
        iataCode: city.iataCode,
        geoCode: { latitude: 40.0, longitude: 2.0 }, // Placeholder coordinates
        address: {
          cityName: city.cityName,
          cityCode: city.iataCode,
          countryName: city.countryName,
          countryCode: city.countryCode,
          regionCode: city.countryCode
        },
        analytics: { travelers: { score: 85 } }
      }
    }
    
    // Generic fallback for unknown airports
    return {
      type: 'location',
      subType: 'AIRPORT', 
      name: `${iataCode} Airport`,
      detailedName: `${iataCode} Airport`,
      id: `${iataCode}-airport`,
      self: { href: '', methods: [] },
      timeZoneOffset: '+01:00',
      iataCode: iataCode.toUpperCase(),
      geoCode: { latitude: 40.0, longitude: 2.0 },
      address: {
        cityName: iataCode,
        cityCode: iataCode.toUpperCase(),
        countryName: 'Unknown',
        countryCode: 'XX',
        regionCode: 'XX'
      },
      analytics: { travelers: { score: 50 } }
    }
  }
  
  /**
   * Create a destination recommendation from theme city data
   */
  private createStaticRecommendation(
    city: ThemeCity, 
    origin: string, 
    theme: string, 
    index: number
  ): DestinationRecommendation {
    // Calculate estimated price based on flight time and city price range
    const basePrice = this.calculateEstimatedPrice(city)
    const estimatedPrice = `€${basePrice - 50}-${basePrice + 50}`
    
    // Get theme-specific score or average if mixed theme
    const themeScore = theme === 'mixed' 
      ? Math.max(...Object.values(city.themeScores))
      : city.themeScores[theme as keyof typeof city.themeScores] || 75
    
    return {
      destination: {
        id: city.iataCode,
        airport_code: city.iataCode,
        city_name: city.cityName,
        country_name: city.countryName,
        country_code: city.countryCode,
        description: city.description || `${city.cityName} - ${city.highlights.join(', ')}`,
        image_url: '',
        activities: [],
        popularity_score: themeScore,
        climate_info: {
          average_temperature: '15-25°C',
          rainy_months: [],
          sunny_months: city.bestMonths,
          climate_type: 'Temperate'
        },
        best_time_to_visit: city.bestMonths,
        budget: {
          level: city.priceRange,
          daily_budget_range: this.getBudgetRange(city.priceRange),
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
      match_score: Math.min(themeScore + (10 - index), 98),
      activity_matches: this.getActivityMatches(theme),
      reason_for_recommendation: `Perfect ${theme === 'mixed' ? 'destination' : theme} spot: ${city.highlights[0]}`,
      estimated_flight_price: estimatedPrice
    }
  }
  
  /**
   * Calculate estimated price based on city data
   */
  private calculateEstimatedPrice(city: ThemeCity): number {
    const flightTimeMultiplier = city.averageFlightTime * 50
    const priceRangeMultiplier = {
      'budget': 0.8,
      'mid-range': 1.0,
      'luxury': 1.4
    }[city.priceRange]
    
    return Math.round((150 + flightTimeMultiplier) * priceRangeMultiplier)
  }
  
  /**
   * Get budget range text based on price level
   */
  private getBudgetRange(priceRange: string): string {
    switch (priceRange) {
      case 'budget': return '€50-100'
      case 'mid-range': return '€100-200'
      case 'luxury': return '€200-400'
      default: return '€100-200'
    }
  }
  
  /**
   * Get activity matches for theme
   */
  private getActivityMatches(theme: string): string[] {
    switch (theme) {
      case 'party': return ['nightlife', 'restaurants', 'bars']
      case 'adventure': return ['outdoor', 'sports', 'nature']
      case 'learn': return ['culture', 'museums', 'history']
      case 'shopping': return ['shopping', 'luxury', 'wellness']
      case 'beach': return ['beach', 'water-sports', 'relaxation']
      default: return ['activities']
    }
  }
  
  /**
   * Health check - always returns true for static data
   */
  async healthCheck(): Promise<boolean> {
    return true
  }
}

// Singleton instance
export const staticFallbackService = new StaticFallbackService()
export default staticFallbackService