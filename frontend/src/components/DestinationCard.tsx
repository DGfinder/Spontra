import { DestinationRecommendation } from '@/services/apiClient'
import { publicPoiService } from '@/services/publicPoiService'
import { generateDestinationAnalytics, getTrendDisplay, getBookingUrgencyDisplay, getPriceRankingDisplay } from '@/lib/priceAnalytics'
import { getThemeBgClass, getThemeClasses, validateTheme, type ThemeKey } from '@/lib/theme'
import { Card, CardHeader, CardMedia, CardStats, CardInsight, CardAction, Badge, PriceBadge, VisaFreeBadge } from '@/components/ui'

interface DestinationCardProps {
  result: DestinationRecommendation
  selectedTheme: string
  maxFlightTime?: number // Made optional for backward compatibility
  departureAirport: string
  index: number
  onExplore?: (destination: DestinationRecommendation) => void
  allDestinations?: DestinationRecommendation[] // For analytics comparison
}

// Helper function to get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  const flagMap: Record<string, string> = {
    'FR': '🇫🇷',
    'IT': '🇮🇹', 
    'ES': '🇪🇸',
    'DE': '🇩🇪',
    'NL': '🇳🇱',
    'PT': '🇵🇹',
    'GB': '🇬🇧',
    'US': '🇺🇸',
    'CA': '🇨🇦',
    'AU': '🇦🇺',
    'JP': '🇯🇵',
    'TH': '🇹🇭',
    'SG': '🇸🇬',
    'AE': '🇦🇪'
  }
  return flagMap[countryCode.toUpperCase()] || '🌍'
}

// Helper function to get theme hover colors (keeping only the unique hover opacity logic)
const getThemeHoverColors = (theme: string) => {
  const validTheme = validateTheme(theme)
  const classes = getThemeClasses(validTheme)
  switch (validTheme) {
    case 'adventure':
      return 'hover:bg-yellow-500/10'
    case 'vibe':
      return 'hover:bg-purple-600/10'
    case 'discover':
      return 'hover:bg-blue-500/10'
    case 'indulge':
      return 'hover:bg-amber-600/10'
    case 'nature':
      return 'hover:bg-green-500/10'
    default:
      return 'hover:bg-blue-500/10'
  }
}

export function DestinationCard({ 
  result, 
  selectedTheme, 
  maxFlightTime, 
  departureAirport, 
  index,
  onExplore,
  allDestinations = [] 
}: DestinationCardProps) {
  const [pois, setPois] = React.useState<{ id: string; name: string; theme?: string }[]>([])
  React.useEffect(() => {
    const destCode = result?.destination?.airport_code
    if (!destCode) return
    publicPoiService
      .list(destCode, { theme: selectedTheme, limit: 5 })
      .then((items) => {
        if (Array.isArray(items)) {
          setPois(items.slice(0, 3).map((p: any) => ({ id: p.id, name: p.name, theme: p.theme })))
        }
      })
      .catch(() => {})
  }, [result?.destination?.airport_code, selectedTheme])
  const destination = result.destination
  const flightTime = result.flight_route.total_duration_minutes / 60
  const flagEmoji = getCountryFlag(destination.country_code)
  const [assignedVideos, setAssignedVideos] = React.useState<any[]>([])
  const [showVideo, setShowVideo] = React.useState<{ url: string; title: string } | null>(null)

  React.useEffect(() => {
    const code = result?.destination?.airport_code
    if (!code) return
    const t = (selectedTheme || '').toLowerCase()
    const params = new URLSearchParams({ destination: code })
    if (t) params.set('theme', t)
    fetch(`/api/media/assign?${params.toString()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        if (json?.ok) setAssignedVideos((json.data || []).slice(0, 3))
      })
      .catch(() => {})
  }, [result?.destination?.airport_code, selectedTheme])
  
  // Generate analytics data with error handling
  const analytics = generateDestinationAnalytics(result, allDestinations || [])
  const trendDisplay = getTrendDisplay(analytics?.priceTrend || { direction: 'stable', change: 0, confidence: 'low', period: '30d', description: 'Price data unavailable' })
  const urgencyDisplay = getBookingUrgencyDisplay(analytics?.bookingInsight?.urgency || 'medium')
  const rankingDisplay = getPriceRankingDisplay(analytics?.priceRanking || 'fair')
  
  const handleExplore = () => {
    if (onExplore) {
      onExplore(result)
    }
  }

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 hover:bg-white/20 transition-all duration-500 cursor-pointer border border-white/20 hover:border-orange-500/50 group hover:scale-105 hover:shadow-2xl ${getThemeHoverColors(selectedTheme)}`}
      style={{
        animationDelay: `${index * 150}ms`,
        animation: 'slideInUp 0.6s ease-out forwards',
        opacity: 0,
        transform: 'translateY(30px)'
      }}
      role="article"
      aria-label={`City: ${destination.city_name}`}
    >
      {/* City-first header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl" role="img" aria-label={`${destination.country_name} flag`}>
            {flagEmoji}
          </span>
          <div className="min-w-0">
            <h3 className="text-2xl font-extrabold text-white leading-tight truncate">{destination.city_name}</h3>
            <p className="text-white/70 text-sm flex items-center gap-2 min-w-0">
              <span className="truncate">{destination.country_name}</span>
              <span className="text-white/30">•</span>
              <span className="truncate">{Math.round(result.match_score)}% match</span>
            </p>
          </div>
        </div>
        {/* Rank badge */}
        <div className={`${rankingDisplay.bgColor} ${rankingDisplay.color} px-2 py-1 rounded text-xs flex items-center gap-1`}>
          <span>{rankingDisplay.icon}</span>
          <span>{rankingDisplay.text}</span>
        </div>
      </div>

      {/* Flight Info with Visual Indicators */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-white/70 text-sm flex items-center">
            ✈️ Flight Time
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full transition-all duration-300 group-hover:bg-orange-400"
                style={{ width: `${(flightTime / (maxFlightTime || 12)) * 100}%` }}
                role="progressbar"
                aria-valuenow={flightTime}
                aria-valuemax={maxFlightTime || 12}
                aria-label={`Flight time: ${flightTime.toFixed(1)} hours`}
              />
            </div>
            <span className="text-white font-medium">{flightTime.toFixed(1)}h</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70 text-sm flex items-center">
            💰 Price Range
          </span>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">
              {result.estimated_flight_price || destination.budget.daily_budget_range}
            </span>
            <div className={`${trendDisplay.bgColor} ${trendDisplay.color} px-1 py-0.5 rounded text-xs flex items-center gap-1`}>
              <span>{trendDisplay.icon}</span>
              <span>{(analytics?.priceTrend?.change || 0) > 0 ? `+${analytics?.priceTrend?.change || 0}%` : (analytics?.priceTrend?.change || 0) === 0 ? 'Stable' : `${analytics?.priceTrend?.change || 0}%`}</span>
            </div>
          </div>
        </div>
        
        {/* Flight Path Hint on Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center py-2">
          <div className="text-white/60 text-xs flex items-center justify-center space-x-2">
            <span>{departureAirport}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-orange-500/50 to-orange-500/20 relative">
              <div className="absolute right-0 w-2 h-2 bg-orange-500 rounded-full transform translate-x-1"></div>
            </div>
            <span>{destination.airport_code}</span>
          </div>
        </div>
      </div>

      {/* City and Activities */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {result.activity_matches.slice(0, 2).map((activity) => (
            <span
              key={activity}
              className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-xs"
            >
              {activity}
            </span>
          ))}
          {pois.map((p) => (
            <span key={p.id} className="bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded text-xs" title={p.theme || ''}>
              {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Videos (assigned) */}
      {assignedVideos.length > 0 && (
        <div className="mb-4">
          <div className="text-white/80 text-sm mb-2">Videos</div>
          <div className="flex gap-2">
            {assignedVideos.map((v: any, i: number) => (
              <button key={v.id || i} className="group relative w-28 h-16 bg-white/10 rounded overflow-hidden border border-white/20 hover:border-orange-400/60"
                onClick={() => setShowVideo({ url: v.url, title: v.title })}
                aria-label={`Play video ${v.title}`}>
                {v.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/70 text-xs">Preview</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate">{v.title}</div>
              </button>
            ))}
          </div>
          {showVideo && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="relative w-full max-w-3xl bg-black/90 border border-white/20 rounded-lg p-3">
                <button className="absolute top-2 right-2 text-white/80 hover:text-white" onClick={() => setShowVideo(null)} aria-label="Close video">✕</button>
                <div className="w-full aspect-video">
                  <iframe
                    src={showVideo.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    title={showVideo.title}
                    className="w-full h-full rounded"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-2 text-white/90 text-sm truncate">{showVideo.title}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Insights */}
      <div className="mb-4 space-y-2">
        {/* Price Trend Insight */}
        <div className={`${trendDisplay.bgColor} border ${trendDisplay.borderColor} rounded-lg p-2`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{trendDisplay.icon}</span>
            <span className={`text-xs font-medium ${trendDisplay.color}`}>Price Trend</span>
          </div>
          <p className="text-white/80 text-xs">{analytics?.priceTrend?.description || 'Price data unavailable'}</p>
        </div>
        
        {/* Booking Recommendation */}
        <div className={`${urgencyDisplay.bgColor} ${urgencyDisplay.color} rounded-lg p-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{urgencyDisplay.icon}</span>
            <div>
              <span className="text-xs font-medium">{urgencyDisplay.text}</span>
              <p className="text-xs opacity-80">{analytics?.bookingInsight?.reasoning || 'Booking recommendation unavailable'}</p>
            </div>
          </div>
        </div>
        
        {/* Seasonal Insight */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🌍</span>
            <span className="text-xs font-medium text-blue-400">Seasonal Tip</span>
          </div>
          <p className="text-white/80 text-xs">{analytics?.seasonalInsight?.recommendation || 'Seasonal information unavailable'}</p>
        </div>
      </div>
      
      {/* Recommendation Reason */}
      {result.reason_for_recommendation && (
        <div className="mb-4">
          <p className="text-white/60 text-xs italic">
            "{result.reason_for_recommendation}"
          </p>
        </div>
      )}

      {/* Select Button with Theme Colors */}
      <button 
        className={`w-full text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg ${getThemeBgClass(validateTheme(selectedTheme), true)}`}
        onClick={handleExplore}
        aria-label={`Explore ${destination.city_name}`}
      >
        Explore {destination.city_name} ✨
      </button>
    </div>
  )
}
