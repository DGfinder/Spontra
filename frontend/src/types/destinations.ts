// Enhanced destination types for backend integration

export interface ThemeScores {
  party: number      // Social & Entertainment: 0-100
  adventure: number  // Active & Outdoor: 0-100
  learn: number      // Cultural & Creative: 0-100
  shopping: number   // Luxury & Indulgent: 0-100
  beach: number      // Relaxation & Family: 0-100
}

export interface EnhancedDestination {
  id: string
  airport_code: string
  city_name: string
  country_name: string
  country_code: string
  description: string
  image_url: string
  activities: EnhancedActivityInfo[]
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
  
  // Enhanced fields from backend
  themeScores?: ThemeScores
  highlights?: string[]
  averageFlightTime?: number
  priceCategory?: 'budget' | 'mid-range' | 'luxury'
  bestMonths?: string[]
}

export interface EnhancedActivityInfo {
  type: ActivityType
  score: number
  description: string
  popular_spots: string[]
  average_price: string
  recommended_days: number
  
  // Enhanced fields
  themeRelevance?: number
  seasonality?: string[]
  difficulty?: 'easy' | 'moderate' | 'challenging'
  indoor?: boolean
}

export interface EnhancedFlightRoute {
  id: string
  origin_airport_code: string
  destination_airport_code: string
  estimated_duration_hours: number
  estimated_duration_minutes: number
  total_duration_minutes: number
  created_at: string
  updated_at: string
  
  // Enhanced fields from backend
  airlines?: string[]
  frequency?: number
  seasonalVariation?: boolean
  priceHistory?: PriceHistoryPoint[]
}

export interface PriceHistoryPoint {
  date: string
  avgPrice: number
  currency: string
  confidence: number
}

export interface EnhancedDestinationRecommendation {
  destination: EnhancedDestination
  flight_route: EnhancedFlightRoute
  match_score: number
  activity_matches: ActivityType[]
  reason_for_recommendation: string
  estimated_flight_price?: string
  
  // Enhanced backend fields
  priceConfidence?: number
  seasonalFactors?: string[]
  bookingRecommendations?: BookingRecommendation[]
  similarDestinations?: string[]
  themeScores?: ThemeScores
  highlights?: string[]
  bestMonths?: string[]
  averageFlightTime?: number
  priceCategory?: 'budget' | 'mid-range' | 'luxury'
}

export interface BookingRecommendation {
  timing: 'immediate' | 'wait' | 'monitor'
  reason: string
  expectedSavings?: number
  bestBookingWindow?: string
}

export interface ThemeDestinationSearchRequest {
  origin: string
  theme: ThemeType
  maxFlightTime?: number
  priceRange?: PriceRange
  countries?: string[]
  maxResults?: number
  
  // Advanced filters
  seasons?: SeasonType[]
  budgetPerDay?: number
  travelStyle?: TravelStyle
  groupSize?: number
}

export interface ThemeDestinationSearchResponse {
  destinations: EnhancedDestinationRecommendation[]
  totalResults: number
  countrySummary: CountrySummary[]
  searchMetadata: SearchMetadata
  priceAnalysis?: PriceAnalysis
  recommendations?: SearchRecommendations
}

export interface CountrySummary {
  countryCode: string
  countryName: string
  cityCount: number
  averageScore: number
  priceRange: string
  topCities: string[]
  
  // Enhanced fields
  averageFlightTime?: number
  visaRequired?: boolean
  currency?: string
  seasonalHighlights?: string[]
}

export interface SearchMetadata {
  theme: string
  origin: string
  searchedAt: string
  processingTimeMs: number
  filtersApplied: string[]
  
  // Enhanced metadata
  dataSource: 'backend' | 'legacy' | 'hybrid'
  cacheHitRatio?: number
  apiCallsUsed?: number
  fallbacksTriggered?: string[]
}

export interface PriceAnalysis {
  averagePrice: number
  priceRange: {
    min: number
    max: number
  }
  currency: string
  priceDistribution: PriceBucket[]
  seasonalTrends?: SeasonalPriceTrend[]
}

export interface PriceBucket {
  range: string
  count: number
  percentage: number
  examples: string[]
}

export interface SeasonalPriceTrend {
  season: SeasonType
  averagePrice: number
  priceChange: number
  recommendation: string
}

export interface SearchRecommendations {
  bestValue: EnhancedDestinationRecommendation[]
  trending: EnhancedDestinationRecommendation[]
  hidden_gems: EnhancedDestinationRecommendation[]
  premium: EnhancedDestinationRecommendation[]
}

// Core types
export type ThemeType = 'party' | 'adventure' | 'learn' | 'shopping' | 'beach'

export type ActivityType = 
  | 'nightlife' | 'restaurants' | 'activities'
  | 'adventure' | 'nature' | 'shopping' 
  | 'culture' | 'sightseeing' | 'beaches' | 'relaxation'

export type PriceRange = 'budget' | 'mid-range' | 'luxury' | 'any'

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter'

export type TravelStyle = 
  | 'budget' | 'backpacker' | 'mid-range' 
  | 'luxury' | 'business' | 'family' | 'solo' | 'couple'

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

// Legacy compatibility types
export interface DestinationRecommendation {
  destination: {
    id: string
    airport_code: string
    city_name: string
    country_name: string
    country_code: string
    description: string
    image_url: string
    activities: any[]
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
  flight_route: {
    id: string
    origin_airport_code: string
    destination_airport_code: string
    estimated_duration_hours: number
    estimated_duration_minutes: number
    total_duration_minutes: number
    created_at: string
    updated_at: string
  }
  match_score: number
  activity_matches: string[]
  reason_for_recommendation: string
  estimated_flight_price?: string
}

// Utility types
export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  metadata?: SearchMetadata
  source?: 'backend' | 'legacy' | 'fallback'
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    cassandra: boolean
    amadeus: boolean
    cache: boolean
  }
  uptime: number
  version: string
}