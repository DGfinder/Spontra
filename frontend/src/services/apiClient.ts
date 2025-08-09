import axios, { AxiosInstance, AxiosResponse } from 'axios'
import {
  EnhancedDestinationRecommendation,
  ThemeDestinationSearchRequest,
  ThemeDestinationSearchResponse,
  HealthCheckResponse
} from '@/types/destinations'

// API Configuration
// Prefer server-provided API_BASE_URL, then public var, then sensible dev default
const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8081'

// Types from the Go backend
export interface DestinationExploreRequest {
  id?: string
  origin_airport_code: string
  min_flight_duration_hours: number
  max_flight_duration_hours: number
  preferred_activities: ActivityType[]
  budget_level?: 'budget' | 'mid-range' | 'luxury' | 'any'
  max_results?: number
  include_visa_required?: boolean
}

export interface DestinationExploreResponse {
  id: string
  explore_request_id: string
  recommended_destinations: DestinationRecommendation[]
  total_results: number
  searched_at: string
  processing_time_ms: number
}

export interface DestinationRecommendation {
  destination: Destination
  flight_route: FlightRoute
  match_score: number
  activity_matches: ActivityType[]
  reason_for_recommendation: string
  estimated_flight_price?: string
}

export interface Destination {
  id: string
  airport_code: string
  city_name: string
  country_name: string
  country_code: string
  description: string
  image_url: string
  activities: ActivityInfo[]
  popularity_score: number
  climate_info: ClimateInfo
  best_time_to_visit: string[]
  budget: BudgetInfo
  timezone: string
  language: string[]
  currency: string
  visa_required: boolean
  created_at: string
  updated_at: string
}

export interface ActivityInfo {
  type: ActivityType
  score: number
  description: string
  popular_spots: string[]
  average_price: string
  recommended_days: number
}

export interface FlightRoute {
  id: string
  origin_airport_code: string
  destination_airport_code: string
  estimated_duration_hours: number
  estimated_duration_minutes: number
  total_duration_minutes: number
  created_at: string
  updated_at: string
}

export interface ClimateInfo {
  average_temperature: string
  rainy_months: string[]
  sunny_months: string[]
  climate_type: string
}

export interface BudgetInfo {
  level: string
  daily_budget_range: string
  currency: string
}

export type ActivityType = 
  | 'activities'
  | 'shopping'
  | 'restaurants'
  | 'nature'
  | 'culture'
  | 'nightlife'
  | 'beaches'
  | 'sightseeing'
  | 'adventure'
  | 'relaxation'

export interface AirportSuggestion {
  code: string
  name: string
  city: string
  country: string
}

// API Client Class
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data)
        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`, response.data)
        return response
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    const response: AxiosResponse<HealthCheckResponse> = await this.client.get('/health')
    return response.data
  }

  // Explore destinations based on preferences
  async exploreDestinations(request: DestinationExploreRequest): Promise<DestinationExploreResponse> {
    const response: AxiosResponse<DestinationExploreResponse> = await this.client.post(
      '/api/v1/explore/destinations',
      request
    )
    return response.data
  }

  // Get destination insights for a specific airport
  async getDestinationInsights(airport: string): Promise<any> {
    const response = await this.client.get(`/api/v1/explore/destinations/${airport}/insights`)
    return response.data
  }

  // Find similar destinations
  async findSimilarDestinations(airport: string, origin: string): Promise<any> {
    const response = await this.client.get(
      `/api/v1/explore/destinations/${airport}/similar?origin=${origin}`
    )
    return response.data
  }

  // Get destination information
  async getDestinationInfo(airport: string): Promise<Destination> {
    const response: AxiosResponse<Destination> = await this.client.get(
      `/api/v1/destinations/${airport}`
    )
    return response.data
  }

  // Get airport suggestions (when implemented)
  async getAirportSuggestions(query: string): Promise<AirportSuggestion[]> {
    try {
      const response: AxiosResponse<AirportSuggestion[]> = await this.client.get(
        `/api/v1/search/suggestions/airports?q=${encodeURIComponent(query)}`
      )
      return response.data
    } catch (error) {
      // Return empty array if endpoint is not implemented yet
      console.warn('Airport suggestions endpoint not implemented, using fallback')
      return []
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export default instance
export default apiClient