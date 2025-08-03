import { DestinationRecommendation } from '@/services/apiClient'

interface DestinationCardProps {
  result: DestinationRecommendation
  selectedTheme: string
  maxFlightTime?: number // Made optional for backward compatibility
  departureAirport: string
  index: number
  onExplore?: (destination: DestinationRecommendation) => void
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

// Helper function to get theme colors
const getThemeColors = (theme: string) => {
  switch (theme) {
    case 'adventure':
      return 'bg-orange-500 hover:bg-orange-600'
    case 'party':
      return 'bg-purple-500 hover:bg-purple-600'
    case 'learn':
      return 'bg-green-500 hover:bg-green-600'
    case 'shopping':
      return 'bg-pink-500 hover:bg-pink-600'
    default:
      return 'bg-blue-500 hover:bg-blue-600'
  }
}

const getThemeHoverColors = (theme: string) => {
  switch (theme) {
    case 'adventure':
      return 'hover:bg-orange-500/10'
    case 'party':
      return 'hover:bg-purple-500/10'
    case 'learn':
      return 'hover:bg-green-500/10'
    case 'shopping':
      return 'hover:bg-pink-500/10'
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
  onExplore 
}: DestinationCardProps) {
  const destination = result.destination
  const flightTime = result.flight_route.total_duration_minutes / 60
  const flagEmoji = getCountryFlag(destination.country_code)
  
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
      aria-label={`Destination: ${destination.country_name}`}
    >
      {/* Country Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl" role="img" aria-label={`${destination.country_name} flag`}>
            {flagEmoji}
          </span>
          <div>
            <h3 className="text-xl font-bold text-white">{destination.country_name}</h3>
            <p className="text-white/60 text-sm">{destination.description}</p>
          </div>
        </div>
        {/* Match Score Badge */}
        <div className="bg-orange-500/20 text-orange-200 px-2 py-1 rounded text-xs">
          {Math.round(result.match_score)}% match
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
          <span className="text-white font-medium">
            {result.estimated_flight_price || destination.budget.daily_budget_range}
          </span>
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
        <p className="text-white/70 text-sm mb-2">Destination</p>
        <div className="flex flex-wrap gap-2">
          <span className="bg-orange-500/20 text-orange-200 px-2 py-1 rounded text-xs">
            {destination.city_name}
          </span>
          {result.activity_matches.slice(0, 2).map((activity) => (
            <span
              key={activity}
              className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-xs"
            >
              {activity}
            </span>
          ))}
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
        className={`w-full text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg ${getThemeColors(selectedTheme)}`}
        onClick={handleExplore}
        aria-label={`Explore ${destination.city_name}`}
      >
        Explore {destination.city_name} ✨
      </button>
    </div>
  )
}