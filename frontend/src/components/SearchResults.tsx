import React, { useState, useMemo } from 'react'
import { DestinationRecommendation } from '@/services/apiClient'
import { LoadingSkeleton } from './LoadingSkeleton'
import { CacheIndicator } from './CacheIndicator'
import { aggregateDestinationsByCountry, getCountryStats } from '@/lib/countryAggregation'
import { useFormData, useSearchStore } from '@/store/searchStore'
import { CountryConstellation } from './CountryConstellation'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'
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
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Search hit some turbulence</h3>
            <p className="text-white/50 text-sm mb-6 max-w-xs">
              {error || 'Unable to search destinations at the moment. Check your connection and try again.'}
            </p>
            <button
              onClick={onRetry}
              className="bg-orange-500 hover:bg-orange-400 active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              aria-label="Retry search"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isError && !isLoading && (!results || results.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
              <span className="text-4xl">🌍</span>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No destinations found</h3>
            <p className="text-white/50 text-sm mb-2 max-w-xs">
              We couldn&apos;t find destinations within {maxFlightTime} hours for your selected theme.
            </p>
            <p className="text-white/30 text-xs mb-6 max-w-xs">
              Try increasing your flight time range or picking a different travel theme.
            </p>
            <button
              onClick={onBackToSearch}
              className="bg-white/10 hover:bg-orange-500/20 border border-orange-500/30 active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            >
              ← Adjust Search
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

SearchResults.displayName = 'SearchResults'


