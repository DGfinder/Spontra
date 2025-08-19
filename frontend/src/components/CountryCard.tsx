'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Clock, MapPin, Plane, ChevronDown, ChevronUp } from 'lucide-react'
import { CountryAggregation } from '@/lib/countryAggregation'
import { getThemeClasses } from '@/lib/theme'
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
  const [mapAvailable, setMapAvailable] = useState(true)
  const themeClasses = getThemeClasses(selectedTheme as any)
  
  // Generate analytics for the cheapest destination (country representative) with error handling
  const countryAnalytics = generateDestinationAnalytics(
    aggregation.cheapestDestination, 
    aggregation.allDestinations || []
  )
  const trendDisplay = getTrendDisplay(countryAnalytics?.priceTrend || { direction: 'stable', change: 0, confidence: 'low', period: '30d', description: 'Price data unavailable' })
  const urgencyDisplay = getBookingUrgencyDisplay(countryAnalytics?.bookingInsight?.urgency || 'medium')
  const rankingDisplay = getPriceRankingDisplay(countryAnalytics?.priceRanking || 'fair')

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

  // Collect up to 8 images and show a small carousel
  const mediaImages = useMemo(() => {
    const urls = (aggregation.allDestinations || [])
      .map(d => d?.destination?.image_url)
      .filter((u): u is string => typeof u === 'string' && u.length > 0)
      .slice(0, 8)
    return urls
  }, [aggregation.allDestinations])

  const [currentImage, setCurrentImage] = useState(0)
  const goPrev = () => setCurrentImage(i => (mediaImages.length ? (i - 1 + mediaImages.length) % mediaImages.length : 0))
  const goNext = () => setCurrentImage(i => (mediaImages.length ? (i + 1) % mediaImages.length : 0))

  // Value highlights based on simple heuristics
  const highlights: Array<{ label: string; color: string }> = useMemo(() => {
    const list: Array<{ label: string; color: string }> = []
    if (aggregation.priceRange.min <= Math.max(150, Math.round(aggregation.averagePrice * 0.7))) {
      list.push({ label: 'Great price', color: 'bg-emerald-500/20 text-emerald-300' })
    }
    if (aggregation.averageFlightTime <= 180) {
      list.push({ label: 'Short flight', color: 'bg-blue-500/20 text-blue-300' })
    }
    if (aggregation.country?.visaFree) {
      list.push({ label: 'Visa-free', color: 'bg-purple-500/20 text-purple-300' })
    }
    const rankText = rankingDisplay?.text?.toLowerCase?.() || ''
    if (rankText.includes('excellent')) list.push({ label: 'Excellent deal', color: 'bg-emerald-600/20 text-emerald-300' })
    if (countryAnalytics?.priceTrend?.direction === 'down' && (Math.abs(countryAnalytics?.priceTrend?.change || 0) >= 5)) {
      list.push({ label: 'Prices dropping', color: 'bg-green-500/15 text-green-300' })
    }
    const seasonText = countryAnalytics?.seasonalInsight?.recommendation?.toLowerCase?.() || ''
    if (seasonText.includes('shoulder')) list.push({ label: 'Shoulder season sweet spot', color: 'bg-sky-500/15 text-sky-300' })
    return list.length ? list : [{ label: 'Well-matched to your filters', color: 'bg-white/10 text-white/70' }]
  }, [aggregation])

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-black/50 transition-all duration-300 hover:border-white/30">
      {/* City-first Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            {mapAvailable ? (
              <img
                src={`/maps/${aggregation.country.code}.svg`}
                alt={`${aggregation.country.name} map`}
                className="w-10 h-10 opacity-80"
                onError={() => setMapAvailable(false)}
              />
            ) : (
              <span className="text-2xl" aria-hidden>
                {aggregation.country.flag}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white leading-tight">
              {aggregation.cheapestDestination.destination.city_name}
            </h3>
            <p className="text-white/70 text-sm flex items-center gap-2">
              <span>{aggregation.country.name}</span>
              <span className="text-white/30">•</span>
              <span>{aggregation.country.continent}</span>
              {aggregation.country.visaFree && (
                <span className="text-emerald-300 text-xs bg-emerald-600/20 border border-emerald-400/30 rounded-full px-2 py-0.5">Visa-free</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl font-bold text-green-400">
              €{Math.round(aggregation.priceRange.min)}
            </div>
            <div className={`${trendDisplay.bgColor} ${trendDisplay.color} px-1 py-0.5 rounded text-xs flex items-center gap-1`}>
              <span>{trendDisplay.icon}</span>
              <span>
                {(countryAnalytics?.priceTrend?.change || 0) > 0 
                  ? `+${countryAnalytics?.priceTrend?.change || 0}%` 
                  : (countryAnalytics?.priceTrend?.change || 0) === 0 
                    ? 'Stable' 
                    : `${countryAnalytics?.priceTrend?.change || 0}%`}
              </span>
            </div>
          </div>
          <div className="text-white/50 text-xs mb-1">from</div>
          <div className={`${rankingDisplay.bgColor} ${rankingDisplay.color} px-2 py-1 rounded text-xs flex items-center gap-1`}>
            <span>{rankingDisplay.icon}</span>
            <span>{rankingDisplay.text}</span>
          </div>
        </div>
      </div>

      {/* Lightweight carousel to communicate feel */}
      {mediaImages.length > 0 && (
        <div className="mb-4">
          <div className="relative h-32 rounded-lg overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaImages[currentImage]} alt="Destination" loading="lazy" className="w-full h-full object-cover" />
            {mediaImages.length > 1 && (
              <>
                <button aria-label="Previous image" onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white/90 rounded-full w-7 h-7 flex items-center justify-center">‹</button>
                <button aria-label="Next image" onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white/90 rounded-full w-7 h-7 flex items-center justify-center">›</button>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {mediaImages.map((_, i) => (
                    <button key={i} aria-label={`Go to image ${i+1}`} onClick={() => setCurrentImage(i)} className={`w-2 h-2 rounded-full ${i === currentImage ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

      {/* Value highlights - concise reasons to pick this country */}
      {highlights.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {highlights.map(h => (
            <span key={h.label} className={`px-2 py-1 rounded-full text-xs ${h.color}`}>{h.label}</span>
          ))}
        </div>
      )}

      {aggregation.cheapestDestination && (
        <>
          {/* Best Deal Highlight with Analytics */}
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-white font-medium">Best deal</div>
            <div className="text-green-400 text-sm">{aggregation.cheapestDestination.destination.city_name} • {aggregation.country.name}</div>
          </div>
          <div className="text-green-400 font-bold">
            {aggregation.cheapestDestination.estimated_flight_price}
          </div>
        </div>
        
        {/* Booking Urgency Indicator */}
        <div className={`${urgencyDisplay.bgColor} ${urgencyDisplay.color} rounded px-2 py-1 flex items-center gap-1`}>
          <span className="text-sm">{urgencyDisplay.icon}</span>
          <span className="text-xs font-medium">{urgencyDisplay.text}</span>
          <span className="text-xs opacity-80">- {countryAnalytics?.bookingInsight?.reasoning || 'Booking recommendation unavailable'}</span>
        </div>
      </div>
        </>
      )}

      {/* Price Range Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Price range:</span>
          <span className="text-white">{formatPriceRange()}</span>
        </div>
        
        {/* Price range visual bar */}
        <div className="mt-2 w-full bg-white/10 rounded-full h-2 relative">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${themeClasses.bg} opacity-70`}
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
          <p className="text-white/80 text-xs">{countryAnalytics?.priceTrend?.description || 'Price data unavailable'}</p>
        </div>
        
        {/* Seasonal Insight */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm">🌍</span>
            <span className="text-xs font-medium text-blue-400">Season</span>
          </div>
          <p className="text-white/80 text-xs">{countryAnalytics?.seasonalInsight?.recommendation || 'Seasonal information unavailable'}</p>
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
        className={`w-full py-3 px-4 ${themeClasses.bg} ${themeClasses.bgHover} text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105`}
      >
        Explore {aggregation.cheapestDestination.destination.city_name}
      </button>
    </div>
  )
}
