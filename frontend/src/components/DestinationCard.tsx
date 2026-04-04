import React, { useMemo } from 'react'
import { DestinationRecommendation } from '@/services/apiClient'
import { generateDestinationAnalytics, getTrendDisplay, getBookingUrgencyDisplay, getPriceRankingDisplay } from '@/lib/priceAnalytics'
import { getThemeBgClass, validateTheme } from '@/lib/theme'

interface DestinationCardProps {
  result: DestinationRecommendation
  selectedTheme: string
  maxFlightTime?: number
  departureAirport: string
  index: number
  onExplore?: (destination: DestinationRecommendation) => void
  allDestinations?: DestinationRecommendation[]
}

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '??'
  const base = 127397
  const upper = countryCode.toUpperCase()
  return String.fromCodePoint(upper.charCodeAt(0) + base, upper.charCodeAt(1) + base)
}

const formatFlightTime = (minutes: number) => {
  const hours = minutes / 60
  return hours >= 1 ? `${hours.toFixed(1)}h` : `${minutes.toFixed(0)}m`
}

export function DestinationCard({
  result,
  selectedTheme,
  maxFlightTime,
  departureAirport,
  index,
  onExplore,
  allDestinations = [],
}: DestinationCardProps) {
  const destination = result.destination
  const flightMinutes = result.flight_route.total_duration_minutes
  const flightDisplay = formatFlightTime(flightMinutes)
  const matchPercent = Math.round(result.match_score)
  const flagEmoji = getFlagEmoji(destination.country_code)
  const theme = validateTheme(selectedTheme)

  const analytics = useMemo(() => generateDestinationAnalytics(result, allDestinations), [result, allDestinations])
  const trendDisplay = useMemo(() => getTrendDisplay(analytics?.priceTrend || { direction: 'stable', change: 0, confidence: 'low', period: '30d', description: 'Price data unavailable' }), [analytics])
  const urgencyDisplay = useMemo(() => getBookingUrgencyDisplay(analytics?.bookingInsight?.urgency || 'medium'), [analytics])
  const rankingDisplay = useMemo(() => getPriceRankingDisplay(analytics?.priceRanking || 'fair'), [analytics])

  const handleExplore = () => {
    onExplore?.(result)
  }

  return (
    <div
      className={`group relative flex flex-col rounded-xl border border-white/20 bg-white/10 p-6 text-white shadow-sm backdrop-blur transition-all duration-200 ease-out hover:-translate-y-2 hover:border-orange-400/60 hover:bg-white/20 hover:shadow-[0_12px_40px_rgba(238,109,22,0.18)] active:scale-[0.99] cursor-pointer ${getThemeBgClass(theme, true)}`}
      style={{ animationDelay: `${index * 120}ms` }}
      role="article"
      aria-label={`Destination card for ${destination.city_name}, ${destination.country_name}`}
    >
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label={`${destination.country_name} flag`}>
            {flagEmoji}
          </span>
          <div>
            <h3 className="truncate text-2xl font-semibold">{destination.city_name}</h3>
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              <span className="truncate">{destination.country_name}</span>
              <span className="text-white/40">/</span>
              <span>{matchPercent}% match</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/70">
          <span className="rounded-full border border-white/20 px-3 py-1">{destination.airport_code}</span>
          <span className="rounded-full border border-white/20 px-3 py-1">From {departureAirport}</span>
        </div>
      </header>

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/15 bg-black/20 p-3">
          <p className="text-xs text-white/60">Flight duration</p>
          <p className="mt-1 text-lg font-semibold">{flightDisplay}</p>
          {maxFlightTime ? <p className="text-xs text-white/50">Preferred max: {maxFlightTime}h</p> : null}
        </div>
        <div className="rounded-lg border border-white/15 bg-black/20 p-3">
          <p className="text-xs text-white/60">Price outlook</p>
          <p className="mt-1 text-lg font-semibold">{rankingDisplay.text}</p>
          <p className="text-xs text-white/50">Competitive index: {analytics?.competitiveIndex?.toFixed(0) ?? '-'}</p>
        </div>
      </section>

      <section className="mb-4 space-y-3">
        <div className={`rounded-lg border ${trendDisplay.borderColor} ${trendDisplay.bgColor} p-3`}>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">{trendDisplay.icon}</span>
            <span className={`text-xs font-medium ${trendDisplay.color}`}>{trendDisplay.label}</span>
          </div>
          <p className="text-xs text-white/80">{analytics?.priceTrend?.description || 'Price data unavailable'}</p>
        </div>
        <div className={`rounded-lg border border-white/10 ${urgencyDisplay.bgColor} p-3`}>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">{urgencyDisplay.icon}</span>
            <span className={`text-xs font-medium ${urgencyDisplay.color}`}>{urgencyDisplay.text}</span>
          </div>
          <p className="text-xs text-white/80">{analytics?.bookingInsight?.reasoning || 'Booking recommendation unavailable'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-blue-900/20 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">SUN</span>
            <span className="text-xs font-medium text-blue-300">Seasonal insight</span>
          </div>
          <p className="text-xs text-white/80">{analytics?.seasonalInsight?.recommendation || 'Seasonal information unavailable'}</p>
        </div>
      </section>

      {result.reason_for_recommendation ? (
        <section className="mb-4">
          <p className="text-xs italic text-white/70">&ldquo;{result.reason_for_recommendation}&rdquo;</p>
        </section>
      ) : null}

      <footer className="mt-auto pt-2">
        <button
          type="button"
          onClick={handleExplore}
          className="w-full rounded-lg border border-orange-500/30 bg-orange-500/10 py-3 text-sm font-medium transition-all duration-150 hover:bg-orange-500/20 hover:border-orange-500/50 active:scale-[0.98] group-hover:border-orange-400/50"
        >
          Explore {destination.city_name} {'->'}
        </button>
      </footer>
    </div>
  )
}
