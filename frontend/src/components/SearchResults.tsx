import React, { useState, useMemo, useCallback } from 'react'
import { Map, List, Globe } from 'lucide-react'
import { DestinationRecommendation } from '@/services/apiClient'
import { DestinationCard } from './DestinationCard'
import { CountryCard } from './CountryCard'
import { LoadingSkeleton } from './LoadingSkeleton'
import { SearchSummaryBar } from './SearchSummaryBar'
import { CacheIndicator } from './CacheIndicator'
import { OptimizedSearchResults } from './optimized/OptimizedSearchResults'
import { aggregateDestinationsByCountry, getCountryStats } from '@/lib/countryAggregation'
import { useFormData, useSearchStore } from '@/store/searchStore'
import { CountryConstellation } from './CountryConstellation'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'
import { getThemeColor, getThemeHoverColor, type ThemeKey } from '@/lib/theme'

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
  const [viewMode, setViewMode] = useState<'destinations' | 'countries' | 'constellation'>('countries')
  const [visaFreeOnly, setVisaFreeOnly] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

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

  // Optimized event handlers with useCallback
  const handleVisaFreeToggle = useCallback(() => {
    setVisaFreeOnly(prev => !prev)
  }, [])

  const handleExploreDestination = useCallback((destination: DestinationRecommendation) => {
    onExploreDestination?.(destination)
  }, [onExploreDestination])
  const preferences = useSearchStore(s => s.preferences)
  const hasPassport = Boolean(preferences.passportCountryCode)

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col">
      {/* Results Header */}
      <div className="p-4 md:p-6 border-b border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white">
              {viewMode === 'countries' ? 'Countries' : viewMode === 'constellation' ? 'Countries (Map)' : 'Cities'} within {
                formData?.flightTimeRange 
                  ? `${formData.flightTimeRange[0]}h – ${formData.flightTimeRange[1]}h` 
                  : `${maxFlightTime || formData?.maxFlightTime || 8}h`
              } from {formData?.departureAirportDetailed || formData?.departureAirport || departureAirport}
            </h2>
            <p className="text-white/70 mt-1 text-sm md:text-base">
              {viewMode === 'countries' 
                ? `Found ${countryStats.totalCountries} countries with ${countryStats.totalDestinations} destinations`
                : `Found ${results.length} destinations for your ${selectedTheme} adventure`
              }
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-2">
               <span className="text-xs text-white/60">{viewMode === 'countries' ? 'Grouped by country' : 'Sorted by price'}:</span>
               {viewMode === 'countries' ? (
                 <span
                   className="text-xs px-2 py-1 rounded"
                   style={{
                     backgroundColor: `${getThemeColor(selectedTheme as ThemeKey)}33`,
                     color: getThemeColor(selectedTheme as ThemeKey)
                   }}
                 >
                   Cheapest city per country
                 </span>
               ) : (
                 <span
                   className="text-xs px-2 py-1 rounded"
                   style={{
                     backgroundColor: `${getThemeHoverColor(selectedTheme as ThemeKey)}33`,
                     color: getThemeHoverColor(selectedTheme as ThemeKey)
                   }}
                 >
                   Best deals first 💰
                 </span>
               )}
              <CacheIndicator className="ml-1" />
              
              {/* View Mode Toggle */}
               <div className="flex items-center ml-2 rounded-full p-1"
                 style={{ backgroundColor: `${getThemeColor(selectedTheme as ThemeKey)}1A` }}>
                 <button
                  onClick={() => setViewMode('destinations')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-all ${
                    viewMode === 'destinations'
                      ? 'text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={{
                    background: viewMode === 'destinations' ? `linear-gradient(90deg, ${getThemeColor(selectedTheme as ThemeKey)}, ${getThemeHoverColor(selectedTheme as ThemeKey)})` : 'transparent'
                  }}
                >
                  <List size={12} />
                  <span>Cities</span>
                </button>
                <button
                  onClick={() => setViewMode('countries')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-all ${
                    viewMode === 'countries'
                      ? 'text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={{
                    background: viewMode === 'countries' ? `linear-gradient(90deg, ${getThemeColor(selectedTheme as ThemeKey)}, ${getThemeHoverColor(selectedTheme as ThemeKey)})` : 'transparent'
                  }}
                >
                  <Globe size={12} />
                  <span>Countries</span>
                </button>
                <button
                  onClick={() => setViewMode('constellation')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-all ${
                    viewMode === 'constellation'
                      ? 'text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={{
                    background: viewMode === 'constellation' ? `linear-gradient(90deg, ${getThemeColor(selectedTheme as ThemeKey)}, ${getThemeHoverColor(selectedTheme as ThemeKey)})` : 'transparent'
                  }}
                >
                  <Map size={12} />
                  <span>Map</span>
                </button>
              </div>

              {/* Back to Countries chip (when viewing city list) */}
              {viewMode === 'destinations' && (
                <button
                  onClick={() => { setSelectedCountry(null); setViewMode('countries') }}
                  className="ml-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors"
                >
                  ← Back to countries
                </button>
              )}

              {/* Visa-free only (if passport set) */}
              {viewMode === 'countries' && hasPassport && (
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
        {!isLoading && !isError && Array.isArray(results) && results.length > 0 && viewMode === 'countries' && (
          <div className="max-w-6xl mx-auto">
            {/* Country Stats Summary */}
            {countryStats.totalCountries > 0 && (
              <div className="mb-6 p-4 rounded-lg"
                style={{
                  background: `linear-gradient(90deg, ${getThemeColor(selectedTheme as ThemeKey)}22, ${getThemeHoverColor(selectedTheme as ThemeKey)}22)`,
                  border: `1px solid ${getThemeColor(selectedTheme as ThemeKey)}4D`
                }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: getThemeColor(selectedTheme as ThemeKey) }}>{countryStats.totalCountries}</div>
                    <div className="text-white/60 text-xs">Countries</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: getThemeHoverColor(selectedTheme as ThemeKey) }}>€{countryStats.averagePrice}</div>
                    <div className="text-white/60 text-xs">Avg Price</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: getThemeColor(selectedTheme as ThemeKey) }}>{countryStats.cheapestCountry}</div>
                    <div className="text-white/60 text-xs">Cheapest</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: getThemeHoverColor(selectedTheme as ThemeKey) }}>{countryStats.continents.length}</div>
                    <div className="text-white/60 text-xs">Continents</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Country Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {countryAggregations.map((aggregation, index) => (
                <CountryCard
                  key={aggregation.country.code || `country-${index}`}
                  aggregation={aggregation}
                  selectedTheme={selectedTheme}
                   onExploreCountry={(agg) => {
                    // Switch to destination view filtered to this country
                    setViewMode('destinations')
                    setSelectedCountry(agg.country.code)
                  }}
                  onSelectDestination={onExploreDestination}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results - Constellation View */}
        {!isLoading && !isError && Array.isArray(results) && results.length > 0 && viewMode === 'constellation' && (
          <div className="max-w-6xl mx-auto">
            <CountryConstellation
              originAirport={departureAirport}
              recommendations={results}
              onCountryClick={(rec) => {
                setSelectedCountry(rec.destination.country_code)
                setViewMode('destinations')
              }}
            />
          </div>
        )}

        {/* Results - Destinations View */}
        {!isLoading && !isError && Array.isArray(results) && results.length > 0 && viewMode === 'destinations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {results
              .filter(result => result && result.destination && result.flight_route)
              .filter(result => !selectedCountry || result.destination.country_code === selectedCountry)
              .sort((a, b) => {
                // Sort by price (extracted from estimated_flight_price)
                const priceA = parseFloat((a.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
                const priceB = parseFloat((b.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))
                return priceA - priceB
              })
              .map((result, index) => (
                <DestinationCard
                  key={result.destination.id || `dest-${index}`}
                  result={result}
                  selectedTheme={selectedTheme}
                  maxFlightTime={maxFlightTime}
                  departureAirport={departureAirport}
                  index={index}
                  onExplore={onExploreDestination}
                  allDestinations={results}
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
})

SearchResults.displayName = 'SearchResults'