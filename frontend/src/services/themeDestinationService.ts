import { apiClient, DestinationRecommendation } from './apiClient'
import { environmentService } from '@/config/environment'
import {
  EnhancedDestinationRecommendation,
  ThemeDestinationSearchRequest,
  ThemeDestinationSearchResponse,
  ThemeType,
  PriceRange
} from '@/types/destinations'

export interface ThemeDestinationRequest {
  origin: string
  theme: string
  maxFlightTime?: number
  priceRange?: 'budget' | 'mid-range' | 'luxury' | 'any'
  countries?: string[]
  maxResults?: number
}

export interface ThemeDestinationResponse {
  destinations: DestinationRecommendation[]
  totalResults: number
  countrySummary: CountrySummary[]
  searchMetadata: {
    theme: string
    origin: string
    searchedAt: string
    processingTimeMs: number
    filtersApplied: string[]
  }
}

export interface CountrySummary {
  countryCode: string
  countryName: string
  cityCount: number
  averageScore: number
  priceRange: string
  topCities: string[]
}

export interface ThemeScoreBreakdown {
  vibe: number       // Social & Entertainment
  adventure: number  // Active & Outdoor
  discover: number   // Cultural & Creative
  indulge: number    // Luxury & Indulgent
  nature: number     // Nature & Relaxation
}

// Use the EnhancedDestinationRecommendation from types/destinations.ts

class ThemeDestinationService {
  
  /**
   * Get theme-based destination recommendations from the backend
   * Replaces the original Spontra theme-city database logic
   */
  async getDestinationsByTheme(request: ThemeDestinationRequest): Promise<ThemeDestinationResponse> {
    try {
      const config = environmentService.getConfig()
      
      if (config.enableDebugLogging) {
        console.log('🎯 Fetching theme-based destinations from backend:', request)
      }
      
      // Convert frontend theme format to backend API request
      const backendRequest = {
        origin_airport_code: request.origin,
        preferred_activities: this.mapThemeToActivities(request.theme),
        min_flight_duration_hours: 0,
        max_flight_duration_hours: request.maxFlightTime || 12,
        budget_level: request.priceRange || 'any',
        max_results: Math.min(request.maxResults || 20, config.maxDestinationResults),
        include_visa_required: true
      }

      // Call the backend API
      const response = await apiClient.exploreDestinations(backendRequest)
      
      // Transform backend response to frontend format
      const transformedResponse: ThemeDestinationResponse = {
        destinations: response.recommended_destinations.map(this.transformBackendDestination),
        totalResults: response.total_results,
        countrySummary: this.generateCountrySummary(response.recommended_destinations),
        searchMetadata: {
          theme: request.theme,
          origin: request.origin,
          searchedAt: response.searched_at,
          processingTimeMs: response.processing_time_ms,
          filtersApplied: this.getAppliedFilters(request)
        }
      }

      if (config.enableDebugLogging) {
        console.log(`✅ Retrieved ${transformedResponse.destinations.length} theme-based destinations`)
      }
      return transformedResponse

    } catch (error) {
      console.error('❌ Theme destination service error:', error)
      
      // Fallback to local theme data if backend unavailable
      console.log('🔄 Falling back to local theme city data')
      return this.getFallbackDestinations(request)
    }
  }

  /**
   * Get destinations for a specific country within a theme
   */
  async getDestinationsByCountryAndTheme(
    countryCode: string, 
    theme: string, 
    origin: string
  ): Promise<DestinationRecommendation[]> {
    try {
      const request: ThemeDestinationRequest = {
        origin,
        theme,
        countries: [countryCode],
        maxResults: 10
      }
      
      const response = await this.getDestinationsByTheme(request)
      return response.destinations

    } catch (error) {
      console.error(`❌ Error fetching destinations for ${countryCode}:`, error)
      return []
    }
  }

  /**
   * Get country aggregation data for theme-based exploration
   */
  async getCountriesByTheme(theme: string, origin: string): Promise<CountrySummary[]> {
    try {
      const response = await this.getDestinationsByTheme({ origin, theme, maxResults: 50 })
      return response.countrySummary
    } catch (error) {
      console.error('❌ Error fetching country data:', error)
      return []
    }
  }

  /**
   * Map frontend theme to backend activity types
   */
  private mapThemeToActivities(theme: string): ('activities' | 'luxury_shopping' | 'spa_treatments' | 'restaurants' | 'nature' | 'culture' | 'nightlife' | 'sightseeing' | 'adventure' | 'relaxation' | 'cooking_classes' | 'food_tours')[] {
    switch (theme.toLowerCase()) {
      case 'vibe':
        return ['nightlife', 'restaurants', 'activities']
      case 'adventure':
        return ['adventure', 'nature', 'activities'] 
      case 'discover':
        return ['culture', 'sightseeing', 'activities', 'cooking_classes', 'food_tours']
      case 'indulge':
        return ['luxury_shopping', 'spa_treatments', 'activities']
      case 'nature':
        return ['nature', 'relaxation', 'adventure']
      default:
        return ['activities']
    }
  }

  /**
   * Transform backend destination format to frontend format
   */
  private transformBackendDestination(backendDest: any): EnhancedDestinationRecommendation {
    return {
      ...backendDest,
      themeScores: this.extractThemeScores(backendDest.destination.activities),
      highlights: this.extractHighlights(backendDest.destination.activities),
      bestMonths: backendDest.destination.best_time_to_visit || [],
      averageFlightTime: backendDest.flight_route.total_duration_minutes / 60,
      priceCategory: this.categorizeBudgetLevel(backendDest.destination.budget?.level)
    }
  }

  /**
   * Extract theme scores from backend activity data
   */
  private extractThemeScores(activities: any[]): ThemeScoreBreakdown {
    const scores = { vibe: 0, adventure: 0, discover: 0, indulge: 0, nature: 0 }
    
    activities?.forEach(activity => {
      switch (activity.type) {
        case 'nightlife':
        case 'restaurants':
          scores.vibe = Math.max(scores.vibe, activity.score || 0)
          break
        case 'adventure':
          scores.adventure = Math.max(scores.adventure, activity.score || 0)
          break
        case 'culture':
        case 'sightseeing':
        case 'cooking_classes':
        case 'food_tours':
          scores.discover = Math.max(scores.discover, activity.score || 0)
          break
        case 'luxury_shopping':
        case 'spa_treatments':
          scores.indulge = Math.max(scores.indulge, activity.score || 0)
          break
        case 'nature':
        case 'relaxation':
          scores.nature = Math.max(scores.nature, activity.score || 0)
          break
      }
    })
    
    return scores
  }

  /**
   * Extract highlights from backend activity data
   */
  private extractHighlights(activities: any[]): string[] {
    return activities?.slice(0, 3).map(activity => 
      activity.description || `Great ${activity.type}`
    ) || []
  }

  /**
   * Categorize budget level from backend format
   */
  private categorizeBudgetLevel(budgetLevel?: string): 'budget' | 'mid-range' | 'luxury' {
    switch (budgetLevel?.toLowerCase()) {
      case 'budget':
      case 'low':
        return 'budget'
      case 'luxury':
      case 'high':
        return 'luxury'
      default:
        return 'mid-range'
    }
  }

  /**
   * Generate country summary from destinations
   */
  private generateCountrySummary(destinations: any[]): CountrySummary[] {
    const countryMap = new Map<string, {
      countryName: string
      cities: string[]
      scores: number[]
      prices: string[]
    }>()

    destinations.forEach(dest => {
      const countryCode = dest.destination.country_code
      const countryName = dest.destination.country_name
      
      if (!countryMap.has(countryCode)) {
        countryMap.set(countryCode, {
          countryName,
          cities: [],
          scores: [],
          prices: []
        })
      }
      
      const country = countryMap.get(countryCode)!
      country.cities.push(dest.destination.city_name)
      country.scores.push(dest.match_score)
      country.prices.push(dest.estimated_flight_price || '€200')
    })

    return Array.from(countryMap.entries()).map(([countryCode, data]) => ({
      countryCode,
      countryName: data.countryName,
      cityCount: data.cities.length,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      priceRange: this.calculatePriceRange(data.prices),
      topCities: data.cities.slice(0, 3)
    }))
  }

  /**
   * Calculate price range from price strings
   */
  private calculatePriceRange(prices: string[]): string {
    const numericPrices = prices.map(price => {
      const match = price.match(/\d+/)
      return match ? parseInt(match[0]) : 200
    })
    
    const min = Math.min(...numericPrices)
    const max = Math.max(...numericPrices)
    
    return `€${min}-${max}`
  }

  /**
   * Get list of applied filters for metadata
   */
  private getAppliedFilters(request: ThemeDestinationRequest): string[] {
    const filters: string[] = []
    
    if (request.maxFlightTime) filters.push(`Flight time: ${request.maxFlightTime}h`)
    if (request.priceRange && request.priceRange !== 'any') filters.push(`Budget: ${request.priceRange}`)
    if (request.countries?.length) filters.push(`Countries: ${request.countries.join(', ')}`)
    if (request.maxResults) filters.push(`Max results: ${request.maxResults}`)
    
    return filters
  }

  /**
   * Fallback to local theme city data if backend unavailable
   */
  private async getFallbackDestinations(request: ThemeDestinationRequest): Promise<ThemeDestinationResponse> {
    try {
      // Import theme cities data as fallback
      const { getTopCitiesForTheme } = await import('@/data/themeCities')
      const themeCities = getTopCitiesForTheme(request.theme, request.maxResults || 20)
      
      // Filter by flight time if specified
      const filteredCities = request.maxFlightTime 
        ? themeCities.filter(city => city.averageFlightTime <= request.maxFlightTime!)
        : themeCities

      // Transform to destination recommendations
      const destinations: EnhancedDestinationRecommendation[] = filteredCities.map(city => ({
        destination: {
          id: city.iataCode,
          airport_code: city.iataCode,
          city_name: city.cityName,
          country_name: city.countryName,
          country_code: city.countryCode,
          description: city.description,
          image_url: '',
          activities: [],
          popularity_score: Math.max(...Object.values(city.themeScores)),
          climate_info: {
            average_temperature: '15-25°C',
            rainy_months: [],
            sunny_months: [],
            climate_type: 'Temperate'
          },
          best_time_to_visit: city.bestMonths,
          budget: {
            level: city.priceRange,
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
          id: `${request.origin}-${city.iataCode}`,
          origin_airport_code: request.origin,
          destination_airport_code: city.iataCode,
          estimated_duration_hours: Math.floor(city.averageFlightTime),
          estimated_duration_minutes: Math.round((city.averageFlightTime % 1) * 60),
          total_duration_minutes: Math.round(city.averageFlightTime * 60),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        match_score: city.themeScores[request.theme as keyof typeof city.themeScores],
        activity_matches: this.mapThemeToActivities(request.theme),
        reason_for_recommendation: `Perfect ${request.theme} destination: ${city.highlights[0]}`,
        estimated_flight_price: `€${Math.round(city.averageFlightTime * 40 + 120)}-${Math.round(city.averageFlightTime * 60 + 200)}`,
        themeScores: city.themeScores,
        highlights: city.highlights,
        bestMonths: city.bestMonths,
        averageFlightTime: city.averageFlightTime,
        priceCategory: city.priceRange
      }))

      const countrySummary = this.generateCountrySummary(destinations)

      return {
        destinations,
        totalResults: destinations.length,
        countrySummary,
        searchMetadata: {
          theme: request.theme,
          origin: request.origin,
          searchedAt: new Date().toISOString(),
          processingTimeMs: 50,
          filtersApplied: this.getAppliedFilters(request)
        }
      }

    } catch (error) {
      console.error('❌ Fallback destination service failed:', error)
      throw new Error('Unable to load destination data')
    }
  }

  /**
   * Health check for the backend service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.healthCheck()
      return true
    } catch (error) {
      console.warn('Backend health check failed:', error)
      return false
    }
  }
}

export const themeDestinationService = new ThemeDestinationService()