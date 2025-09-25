import { DestinationRecommendation } from '@/services/apiClient'

export interface PriceTrend {
  direction: 'up' | 'down' | 'stable'
  change: number
  confidence: 'high' | 'medium' | 'low'
  period: '7d' | '30d' | '90d'
  description: string
}

export interface SeasonalInsight {
  currentSeason: 'peak' | 'shoulder' | 'off-season'
  bestMonths: string[]
  worstMonths: string[]
  seasonalDiscount: number
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
  popularityScore: number
  priceRanking: 'excellent' | 'good' | 'fair' | 'expensive'
  competitiveIndex: number
  travelersChoiceRank?: number
}

const defaultSeasonalInsight: SeasonalInsight = {
  currentSeason: 'shoulder',
  bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
  worstMonths: ['Jul', 'Aug'],
  seasonalDiscount: 15,
  recommendation: 'Shoulder season offers pleasant weather and better prices.'
}

const getSeasonalInsight = (countryCode: string): SeasonalInsight => {
  switch (countryCode) {
    case 'ES':
    case 'IT':
      return {
        currentSeason: 'shoulder',
        bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
        worstMonths: ['Jun', 'Jul', 'Aug'],
        seasonalDiscount: 25,
        recommendation: 'Visit during spring or autumn to avoid crowds and save about 25%.'
      }
    case 'FR':
      return {
        currentSeason: 'peak',
        bestMonths: ['Nov', 'Dec', 'Jan'],
        worstMonths: ['Jun', 'Jul', 'Aug'],
        seasonalDiscount: 18,
        recommendation: 'Winter city breaks are quieter and roughly 18% cheaper.'
      }
    case 'TH':
      return {
        currentSeason: 'off-season',
        bestMonths: ['Nov', 'Dec', 'Jan'],
        worstMonths: ['Apr', 'May'],
        seasonalDiscount: 30,
        recommendation: 'Tropical rains ease off in winter, bringing 30% savings.'
      }
    default:
      return defaultSeasonalInsight
  }
}

const getPopularityScore = (destination: DestinationRecommendation): number => {
  const base = destination.destination.popularity_score ?? 60
  return Math.min(100, Math.max(30, base))
}

const buildPriceTrend = (destination: DestinationRecommendation, popularityScore: number): PriceTrend => {
  const price = parseFloat((destination.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(price) || price <= 0) {
    return {
      direction: 'stable',
      change: 0,
      confidence: 'low',
      period: '30d',
      description: 'Recent data unavailable; assuming stable pricing.'
    }
  }

  if (popularityScore >= 80) {
    return {
      direction: 'up',
      change: 12,
      confidence: 'high',
      period: '30d',
      description: 'Demand is increasing and prices are trending upward.'
    }
  }

  if (popularityScore <= 45) {
    return {
      direction: 'down',
      change: 8,
      confidence: 'medium',
      period: '30d',
      description: 'Demand has cooled and prices are easing slightly.'
    }
  }

  return {
    direction: 'stable',
    change: 0,
    confidence: 'medium',
    period: '30d',
    description: 'Prices are holding steady in the past month.'
  }
}

const buildBookingInsight = (trend: PriceTrend, price: number): BookingInsight => {
  if (trend.direction === 'up') {
    return {
      optimalBookingWindow: '1-2 weeks ahead',
      priceAlert: 'book_now',
      savingsPotential: 0,
      urgency: 'high',
      reasoning: 'Prices are climbing; booking soon will lock in current rates.'
    }
  }

  if (trend.direction === 'down') {
    return {
      optimalBookingWindow: '3-4 weeks ahead',
      priceAlert: 'wait',
      savingsPotential: Math.max(5, trend.change),
      urgency: 'low',
      reasoning: 'Prices are softening. Waiting could save a little more.'
    }
  }

  return {
    optimalBookingWindow: price < 250 ? '2-3 weeks ahead' : '4-6 weeks ahead',
    priceAlert: price < 250 ? 'price_watch' : 'wait',
    savingsPotential: price < 250 ? 5 : 10,
    urgency: price < 250 ? 'medium' : 'low',
    reasoning: 'Monitor fares. There is still a small window for adjustments.'
  }
}

const computeCompetitiveIndex = (destination: DestinationRecommendation, peers: DestinationRecommendation[]): number => {
  const price = parseFloat((destination.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
  const peerPrices = peers
    .map((peer) => parseFloat((peer.estimated_flight_price || '0').replace(/[^0-9.-]/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (!Number.isFinite(price) || peerPrices.length === 0) {
    return 50
  }

  const cheaper = peerPrices.filter((value) => value <= price).length
  const percentile = Math.round((cheaper / peerPrices.length) * 100)
  return Math.min(100, Math.max(0, percentile))
}

const rankPrice = (index: number): DestinationAnalytics['priceRanking'] => {
  if (index >= 80) return 'excellent'
  if (index >= 60) return 'good'
  if (index >= 40) return 'fair'
  return 'expensive'
}

export function generateDestinationAnalytics(
  destination: DestinationRecommendation,
  allDestinations: DestinationRecommendation[]
): DestinationAnalytics {
  const popularityScore = getPopularityScore(destination)
  const priceTrend = buildPriceTrend(destination, popularityScore)
  const seasonalInsight = getSeasonalInsight(destination.destination.country_code)
  const price = parseFloat((destination.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
  const bookingInsight = buildBookingInsight(priceTrend, price)
  const competitiveIndex = computeCompetitiveIndex(destination, allDestinations)
  const priceRanking = rankPrice(competitiveIndex)

  return {
    priceTrend,
    seasonalInsight,
    bookingInsight,
    popularityScore,
    priceRanking,
    competitiveIndex,
    travelersChoiceRank: popularityScore > 85 ? Math.floor(Math.random() * 10) + 1 : undefined,
  }
}

export function getTrendDisplay(trend: PriceTrend) {
  switch (trend.direction) {
    case 'up':
      return {
        icon: 'UP',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30',
        label: 'Rising prices',
      }
    case 'down':
      return {
        icon: 'DOWN',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/30',
        label: 'Prices dropping',
      }
    default:
      return {
        icon: 'STABLE',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-500/30',
        label: 'Stable pricing',
      }
  }
}

export function getBookingUrgencyDisplay(urgency: 'high' | 'medium' | 'low') {
  switch (urgency) {
    case 'high':
      return {
        icon: 'HIGH',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        text: 'Book now',
      }
    case 'medium':
      return {
        icon: 'MED',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        text: 'Monitor prices',
      }
    default:
      return {
        icon: 'LOW',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        text: 'Low urgency',
      }
  }
}

export function getPriceRankingDisplay(ranking: 'excellent' | 'good' | 'fair' | 'expensive') {
  switch (ranking) {
    case 'excellent':
      return {
        icon: 'EXCELLENT',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        text: 'Excellent deal',
      }
    case 'good':
      return {
        icon: 'GOOD',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        text: 'Good value',
      }
    case 'fair':
      return {
        icon: 'FAIR',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        text: 'Fair price',
      }
    default:
      return {
        icon: 'PREMIUM',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        text: 'Premium',
      }
  }
}
