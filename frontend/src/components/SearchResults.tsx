import { DestinationRecommendation } from '@/services/apiClient'
import { DestinationCard } from './DestinationCard'
import { LoadingSkeleton } from './LoadingSkeleton'
import { SearchSummaryBar } from './SearchSummaryBar'
import { useFormData } from '@/store/searchStore'

interface SearchResultsProps {
  results: DestinationRecommendation[]
  isLoading: boolean
  isError: boolean
  error: string | null
  maxFlightTime?: number // Made optional for backward compatibility
  departureAirport: string
  selectedTheme: string
  onBackToSearch: () => void
  onRetry: () => void
  onExploreDestination?: (destination: DestinationRecommendation) => void
}

export function SearchResults({
  results,
  isLoading,
  isError,
  error,
  maxFlightTime,
  departureAirport,
  selectedTheme,
  onBackToSearch,
  onRetry,
  onExploreDestination
}: SearchResultsProps) {
  // Get current search data for the summary bar
  const formData = useFormData()

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col">
      {/* Search Summary Bar */}
      <SearchSummaryBar searchData={formData} />
      {/* Results Header */}
      <div className="p-4 md:p-6 border-b border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white">
              Countries within {
                formData?.flightTimeRange 
                  ? `${formData.flightTimeRange[0]}h - ${formData.flightTimeRange[1]}h` 
                  : `${maxFlightTime || formData?.maxFlightTime || 8}h`
              } from {departureAirport}
            </h2>
            <p className="text-white/70 mt-1 text-sm md:text-base">
              Found {results.length} destinations for your {selectedTheme} adventure
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-white/50">Sorted by proximity:</span>
              <span className="text-xs bg-orange-500/20 text-orange-200 px-2 py-1 rounded">
                Closest first ✈️
              </span>
            </div>
          </div>
          <button
            onClick={onBackToSearch}
            className="bg-white/20 hover:bg-white/30 text-white px-3 md:px-4 py-2 rounded-lg transition-colors duration-200 text-sm md:text-base"
            aria-label="Go back to search form"
          >
            ← Back to Search
          </button>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Loading State */}
        {Boolean(isLoading) && <LoadingSkeleton count={6} />}

        {/* Results */}
        {!isLoading && !isError && Array.isArray(results) && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {results
              .filter(result => result && result.destination && result.flight_route)
              .sort((a, b) => a.flight_route.total_duration_minutes - b.flight_route.total_duration_minutes)
              .map((result, index) => (
                <DestinationCard
                  key={result.destination.id || `dest-${index}`}
                  result={result}
                  selectedTheme={selectedTheme}
                  maxFlightTime={maxFlightTime}
                  departureAirport={departureAirport}
                  index={index}
                  onExplore={onExploreDestination}
                />
              ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">
              ⚠️ Search failed
            </div>
            <div className="text-white/60 text-sm mb-4">
              {error || 'Unable to search destinations at the moment'}
            </div>
            <button
              onClick={onRetry}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              aria-label="Retry search"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isError && !isLoading && (!results || results.length === 0) && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg">
              No destinations found within {maxFlightTime} hours.
            </div>
            <div className="text-white/40 text-sm mt-2">
              Try increasing your flight time range or selecting a different theme.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}