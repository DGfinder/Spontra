'use client'

import { useState } from 'react'
import { Clock, MapPin, Plane, Users, ChevronDown, ChevronUp, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { CountryAggregation } from '@/lib/countryAggregation'
import { getThemeColor } from '@/lib/theme'
import { generateDestinationAnalytics, getTrendDisplay, getBookingUrgencyDisplay, getPriceRankingDisplay } from '@/lib/priceAnalytics'

interface CountryCardProps {
  aggregation: CountryAggregation
  selectedTheme: string
  onExploreCountry?: (aggregation: CountryAggregation) => void
  onSelectDestination?: (destination: any) => void
}

export function CountryCard({ 
  aggregation, 
  selectedTheme, 
  onExploreCountry,
  onSelectDestination 
}: CountryCardProps) {
  const [showAllDestinations, setShowAllDestinations] = useState(false)
  const themeColor = getThemeColor(selectedTheme as any)
  
  // Generate analytics for the cheapest destination (country representative)
  const countryAnalytics = generateDestinationAnalytics(
    aggregation.cheapestDestination, 
    aggregation.allDestinations
  )
  const trendDisplay = getTrendDisplay(countryAnalytics.priceTrend)
  const urgencyDisplay = getBookingUrgencyDisplay(countryAnalytics.bookingInsight.urgency)
  const rankingDisplay = getPriceRankingDisplay(countryAnalytics.priceRanking)

  const formatFlightTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatPriceRange = () => {
    if (aggregation.priceRange.min === aggregation.priceRange.max) {
      return `€${aggregation.priceRange.min}`
    }
    return `€${aggregation.priceRange.min} - €${aggregation.priceRange.max}`
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-black/50 transition-all duration-300 hover:border-white/30">
      {/* Country Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-4xl">{aggregation.country.flag}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{aggregation.country.name}</h3>
            <p className="text-white/60 text-sm">{aggregation.country.continent}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl font-bold text-green-400">
              €{Math.round(aggregation.priceRange.min)}
            </div>
            <div className={`${trendDisplay.bgColor} ${trendDisplay.color} px-1 py-0.5 rounded text-xs flex items-center gap-1`}>
              <span>{trendDisplay.icon}</span>
              <span>{countryAnalytics.priceTrend.change > 0 ? `+${countryAnalytics.priceTrend.change}%` : countryAnalytics.priceTrend.change === 0 ? 'Stable' : `${countryAnalytics.priceTrend.change}%`}</span>
            </div>
          </div>
          <div className="text-white/50 text-xs mb-1">from</div>
          <div className={`${rankingDisplay.bgColor} ${rankingDisplay.color} px-2 py-1 rounded text-xs flex items-center gap-1`}>
            <span>{rankingDisplay.icon}</span>
            <span>{rankingDisplay.text}</span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <MapPin size={16} className="text-blue-400" />
          </div>
          <div className="text-white font-semibold">
            {aggregation.destinationCount}
          </div>
          <div className="text-white/50 text-xs">
            {aggregation.destinationCount === 1 ? 'City' : 'Cities'}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock size={16} className="text-yellow-400" />
          </div>
          <div className="text-white font-semibold">
            {formatFlightTime(aggregation.averageFlightTime)}
          </div>
          <div className="text-white/50 text-xs">Avg Flight</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Plane size={16} className="text-purple-400" />
          </div>
          <div className="text-white font-semibold">
            €{aggregation.averagePrice}
          </div>
          <div className="text-white/50 text-xs">Avg Price</div>
        </div>
      </div>

      {/* Best Deal Highlight with Analytics */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-white font-medium">
              {aggregation.cheapestDestination.destination.city_name}
            </div>
            <div className="text-green-400 text-sm">
              Best deal in {aggregation.country.name}
            </div>
          </div>
          <div className="text-green-400 font-bold">
            {aggregation.cheapestDestination.estimated_flight_price}
          </div>
        </div>
        
        {/* Booking Urgency Indicator */}
        <div className={`${urgencyDisplay.bgColor} ${urgencyDisplay.color} rounded px-2 py-1 flex items-center gap-1`}>
          <span className="text-sm">{urgencyDisplay.icon}</span>
          <span className="text-xs font-medium">{urgencyDisplay.text}</span>
          <span className="text-xs opacity-80">- {countryAnalytics.bookingInsight.reasoning}</span>
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Price range:</span>
          <span className="text-white">{formatPriceRange()}</span>
        </div>
        
        {/* Price range visual bar */}
        <div className="mt-2 w-full bg-white/10 rounded-full h-2 relative">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${themeColor} opacity-70`}
            style={{ width: '100%' }}
          />
          <div className="absolute left-2 top-0 w-1 h-full bg-green-400 rounded-full" />
          <div className="absolute right-2 top-0 w-1 h-full bg-red-400 rounded-full" />
        </div>
        <div className="flex justify-between text-xs text-white/50 mt-1">
          <span>€{aggregation.priceRange.min}</span>
          <span>€{aggregation.priceRange.max}</span>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {/* Price Trend */}
        <div className={`${trendDisplay.bgColor} border ${trendDisplay.borderColor} rounded-lg p-2`}>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm">{trendDisplay.icon}</span>
            <span className={`text-xs font-medium ${trendDisplay.color}`}>Trend</span>
          </div>
          <p className="text-white/80 text-xs">{countryAnalytics.priceTrend.description}</p>
        </div>
        
        {/* Seasonal Insight */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm">🌍</span>
            <span className="text-xs font-medium text-blue-400">Season</span>
          </div>
          <p className="text-white/80 text-xs">{countryAnalytics.seasonalInsight.recommendation}</p>
        </div>
      </div>
      
      {/* Top Activities */}
      {aggregation.topActivities.length > 0 && (
        <div className="mb-4">
          <div className="text-white/70 text-sm mb-2">Popular for:</div>
          <div className="flex flex-wrap gap-2">
            {aggregation.topActivities.map(activity => (
              <span 
                key={activity}
                className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Show All Destinations Toggle */}
      {aggregation.destinationCount > 1 && (
        <div className="mb-4">
          <button
            onClick={() => setShowAllDestinations(!showAllDestinations)}
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {showAllDestinations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>
              {showAllDestinations ? 'Hide' : 'Show'} all {aggregation.destinationCount} destinations
            </span>
          </button>
        </div>
      )}

      {/* All Destinations List */}
      {showAllDestinations && (
        <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
          {aggregation.allDestinations.map((destination, index) => (
            <div 
              key={destination.destination.id || index}
              className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              onClick={() => onSelectDestination?.(destination)}
            >
              <div>
                <div className="text-white text-sm font-medium">
                  {destination.destination.city_name}
                </div>
                <div className="text-white/60 text-xs">
                  {formatFlightTime(destination.flight_route.total_duration_minutes)} flight
                </div>
              </div>
              <div className="text-green-400 font-medium text-sm">
                {destination.estimated_flight_price}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onExploreCountry?.(aggregation)}
        className={`w-full py-3 px-4 bg-gradient-to-r ${themeColor} text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 hover:scale-105`}
      >
        Explore {aggregation.country.name}
      </button>
    </div>
  )
}