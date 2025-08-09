// Price trend analysis and analytics utilities
// Leverages Amadeus analytics data and historical patterns

import { DestinationRecommendation } from '@/services/apiClient'

export interface PriceTrend {
  direction: 'up' | 'down' | 'stable'
  change: number // Percentage change
  confidence: 'high' | 'medium' | 'low'
  period: '7d' | '30d' | '90d'
  description: string
}

export interface SeasonalInsight {
  currentSeason: 'peak' | 'shoulder' | 'off-season'
  bestMonths: string[]
  worstMonths: string[]
  seasonalDiscount: number // Percentage savings in off-season
  recommendation: string
}

export interface BookingInsight {
  optimalBookingWindow: string
  priceAlert: 'book_now' | 'wait' | 'price_watch'
  savingsPotential: number
  urgency: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface DestinationAnalytics {
  priceTrend: PriceTrend
  seasonalInsight: SeasonalInsight
  bookingInsight: BookingInsight
  popularityScore: number // 0-100 based on searches/bookings
  priceRanking: 'excellent' | 'good' | 'fair' | 'expensive'
  competitiveIndex: number // How this price compares to similar destinations
  travelersChoiceRank?: number // Ranking among similar destinations
}

// Mock price trend data based on destination characteristics
// In production, this would come from historical pricing APIs
const SEASONAL_PATTERNS: Record<string, SeasonalInsight> = {
  // European destinations
  'ES': {
    currentSeason: 'shoulder',
    bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
    worstMonths: ['Jul', 'Aug'],
    seasonalDiscount: 25,
    recommendation: 'Visit in spring/fall for 25% savings and perfect weather'
  },
  'IT': {
    currentSeason: 'shoulder',
    bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
    worstMonths: ['Jun', 'Jul', 'Aug'],
    seasonalDiscount: 30,
    recommendation: 'Avoid summer crowds - spring offers 30% savings'
  },
  'FR': {
    currentSeason: 'peak',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb'],
    worstMonths: ['Jun', 'Jul', 'Aug'],
    seasonalDiscount: 20,
    recommendation: 'Winter visits offer 20% savings and festive atmosphere'
  },
  'GR': {
    currentSeason: 'off-season',
    bestMonths: ['May', 'Jun', 'Sep'],
    worstMonths: ['Jul', 'Aug'],
    seasonalDiscount: 35,
    recommendation: 'Perfect timing! Off-season offers 35% savings'
  }
}

// Price trend simulation based on various factors
function generatePriceTrend(
  destination: DestinationRecommendation,
  popularityScore: number
): PriceTrend {
  const price = parseFloat((destination.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
  const countryCode = destination.destination.country_code
  
  // Simulate trends based on popularity and seasonal factors
  let direction: 'up' | 'down' | 'stable' = 'stable'
  let change = 0
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  let description = 'Prices stable over the last month'

  // High popularity destinations tend to have upward price pressure
  if (popularityScore > 80) {
    direction = 'up'
    change = Math.floor(Math.random() * 15) + 5 // 5-20% increase
    confidence = 'high'
    description = `Prices trending up ${change}% due to high demand`
  } else if (popularityScore < 40) {
    direction = 'down'
    change = Math.floor(Math.random() * 12) + 3 // 3-15% decrease
    confidence = 'medium'
    description = `Prices down ${change}% - great deals available`
  } else if (price < 200) {
    // Good deals tend to be stable or trending up as they get discovered
    direction = Math.random() > 0.6 ? 'up' : 'stable'
    change = direction === 'up' ? Math.floor(Math.random() * 8) + 2 : 0
    description = direction === 'up' ? 
      `Prices rising ${change}% as deal gains popularity` : 
      'Prices stable - book soon to secure deal'
  }

  return {
    direction,
    change,
    confidence,
    period: '30d',
    description
  }
}

// Generate seasonal insights based on destination and current date
function generateSeasonalInsight(destination: DestinationRecommendation): SeasonalInsight {
  const countryCode = destination.destination.country_code
  const defaultInsight: SeasonalInsight = {
    currentSeason: 'shoulder',
    bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
    worstMonths: ['Jul', 'Aug'],
    seasonalDiscount: 15,
    recommendation: 'Visit in shoulder season for better prices'
  }

  return SEASONAL_PATTERNS[countryCode] || defaultInsight
}

// Generate booking recommendations based on price and trends
function generateBookingInsight(
  destination: DestinationRecommendation,
  priceTrend: PriceTrend,
  popularityScore: number
): BookingInsight {
  const price = parseFloat((destination.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
  
  // Excellent deals (under €200) with upward trends = book now
  if (price < 200 && priceTrend.direction === 'up') {
    return {
      optimalBookingWindow: '1-2 weeks ahead',
      priceAlert: 'book_now',
      savingsPotential: 0,
      urgency: 'high',
      reasoning: 'Excellent price trending up - book now to secure deal'
    }
  }
  
  // Good deals with stable prices = moderate urgency
  if (price < 250 && priceTrend.direction === 'stable') {
    return {
      optimalBookingWindow: '2-4 weeks ahead',
      priceAlert: 'price_watch',
      savingsPotential: 10,
      urgency: 'medium',
      reasoning: 'Good price - monitor for potential 10% savings'
    }
  }
  
  // High prices with downward trend = wait
  if (price > 300 && priceTrend.direction === 'down') {
    return {
      optimalBookingWindow: '4-6 weeks ahead',
      priceAlert: 'wait',
      savingsPotential: priceTrend.change,
      urgency: 'low',
      reasoning: `Prices dropping ${priceTrend.change}% - wait for better deals`
    }
  }
  
  // Default recommendation
  return {
    optimalBookingWindow: '3-4 weeks ahead',
    priceAlert: 'price_watch',
    savingsPotential: 5,
    urgency: 'medium',
    reasoning: 'Monitor prices for optimal booking timing'
  }
}

// Calculate competitive pricing index
function calculateCompetitiveIndex(
  destination: DestinationRecommendation,
  allDestinations: DestinationRecommendation[]
): number {
  const price = parseFloat((destination.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
  const allPrices = allDestinations
    .map(d => parseFloat((d.estimated_flight_price || '0').replace(/[^0-9.-]/g, '')))
    .filter(p => p > 0)
    .sort((a, b) => a - b)
  
  const position = allPrices.indexOf(price)
  const percentile = (1 - (position / allPrices.length)) * 100
  
  return Math.round(percentile)
}

// Determine price ranking category
function getPriceRanking(competitiveIndex: number): 'excellent' | 'good' | 'fair' | 'expensive' {
  if (competitiveIndex >= 80) return 'excellent'
  if (competitiveIndex >= 60) return 'good'
  if (competitiveIndex >= 40) return 'fair'
  return 'expensive'
}

/**
 * Generate comprehensive analytics for a destination
 */
export function generateDestinationAnalytics(
  destination: DestinationRecommendation,
  allDestinations: DestinationRecommendation[]
): DestinationAnalytics {
  // Use Amadeus analytics data or simulate based on destination characteristics
  const popularityScore = destination.destination.popularity_score || 
    Math.floor(Math.random() * 40) + 50 // 50-90 range

  const priceTrend = generatePriceTrend(destination, popularityScore)
  const seasonalInsight = generateSeasonalInsight(destination)
  const bookingInsight = generateBookingInsight(destination, priceTrend, popularityScore)
  const competitiveIndex = calculateCompetitiveIndex(destination, allDestinations)
  const priceRanking = getPriceRanking(competitiveIndex)

  return {
    priceTrend,
    seasonalInsight,
    bookingInsight,
    popularityScore,
    priceRanking,
    competitiveIndex,
    travelersChoiceRank: popularityScore > 80 ? Math.floor(Math.random() * 10) + 1 : undefined
  }
}

/**
 * Get trend icon and color for UI display
 */
export function getTrendDisplay(trend: PriceTrend) {
  switch (trend.direction) {
    case 'up':
      return {
        icon: '📈',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30'
      }
    case 'down':
      return {
        icon: '📉',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/30'
      }
    case 'stable':
      return {
        icon: '📊',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-500/30'
      }
  }
}

/**
 * Get booking urgency display
 */
export function getBookingUrgencyDisplay(urgency: 'high' | 'medium' | 'low') {
  switch (urgency) {
    case 'high':
      return {
        icon: '🔥',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        text: 'Book Now'
      }
    case 'medium':
      return {
        icon: '⏰',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        text: 'Monitor'
      }
    case 'low':
      return {
        icon: '😌',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        text: 'Wait'
      }
  }
}

/**
 * Get price ranking badge
 */
export function getPriceRankingDisplay(ranking: 'excellent' | 'good' | 'fair' | 'expensive') {
  switch (ranking) {
    case 'excellent':
      return {
        icon: '🎯',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        text: 'Excellent Deal'
      }
    case 'good':
      return {
        icon: '👍',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        text: 'Good Value'
      }
    case 'fair':
      return {
        icon: '💰',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        text: 'Fair Price'
      }
    case 'expensive':
      return {
        icon: '💸',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        text: 'Premium'
      }
  }
}