import React, { useState, useMemo } from 'react'
import { DestinationRecommendation } from '@/lib/stubs'
import { LoadingSkeleton } from './LoadingSkeleton'
import { CacheIndicator } from './CacheIndicator'
import { aggregateDestinationsByCountry, getCountryStats } from '@/lib/countryAggregation'
import { useFormData } from '@/lib/stubs'
import { CountryConstellation } from './CountryConstellation'
import { usePerformanceMonitoring } from '@/lib/stubs'
import { getThemeColor, type ThemeKey } from '@/lib/theme'

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

export const SearchResults = React.memo<SearchResultsProps>(({
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
}) => {
  // Performance monitoring
  usePerformanceMonitoring('SearchResults')
  
  // Get current search data for the summary bar
  const formData = useFormData()
  const [visaFreeOnly, setVisaFreeOnly] = useState(false)

  // Memoized country aggregations to avoid expensive recalculations
  const countryAggregations = useMemo(() => {
    let aggregations = aggregateDestinationsByCountry(results)
    if (visaFreeOnly) {
      aggregations = aggregations.filter(agg => agg.country.visaFree)
    }
    return aggregations
  }, [results, visaFreeOnly])

  // Memoized country statistics
  const countryStats = useMemo(() => {
    return getCountryStats(countryAggregations)
  }, [countryAggregations])

  const preferences = useSearchStore(s => s.preferences)
  const hasPassport = Boolean(preferences.passportCountryCode)

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col">
      {/* Results Header */}
      <div className="p-4 md:p-6 border-b border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white">
              Countries within {
                formData?.flightTimeRange
                  ? `${formData.flightTimeRange[0]}h – ${formData.flightTimeRange[1]}h`
                  : `${maxFlightTime || formData?.maxFlightTime || 8}h`
              } from {formData?.departureAirportDetailed || formData?.departureAirport || departureAirport}
            </h2>
            <p className="text-white/70 mt-1 text-sm md:text-base">
              Found {countryStats.totalCountries} countries with {countryStats.totalDestinations} destinations for your {selectedTheme} adventure
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: `${getThemeColor(selectedTheme as ThemeKey)}33`,
                  color: getThemeColor(selectedTheme as ThemeKey)
                }}
              >
                Constellation view
              </span>
              <CacheIndicator className="ml-1" />

              {/* Visa-free only (if passport set) */}
              {hasPassport && (
                <label className="ml-2 flex items-center gap-2 text-xs px-2 py-1 rounded cursor-pointer"
                  style={{
                    backgroundColor: `${getThemeColor(selectedTheme as ThemeKey)}1A`,
                    color: getThemeColor(selectedTheme as ThemeKey)
                  }}>
                  <input type="checkbox" checked={visaFreeOnly} onChange={(e) => setVisaFreeOnly(e.target.checked)} />
                  Visa-free only
                </label>
              )}
            </div>
          </div>
          <button
            onClick={onBackToSearch}
            className="text-white px-3 md:px-4 py-2 rounded-lg transition-colors duration-200 text-sm md:text-base"
            style={{ backgroundColor: `${getThemeColor(selectedTheme as ThemeKey)}26` }}
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

        {/* Results - Country View */}

        {/* Results - Constellation View Only */}
        {!isLoading && !isError && Array.isArray(results) && results.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <CountryConstellation
              originAirport={departureAirport}
              recommendations={results}
              onCountryClick={(rec) => {
                onExploreDestination?.(rec)
              }}
            />
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
})

SearchResults.displayName = 'SearchResults'


