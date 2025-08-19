'use client'

import React, { useMemo, useCallback } from 'react'
import { ArrowLeft, Globe, Filter } from 'lucide-react'
import { CountryCard } from '../CountryCard'
import { Button, Badge } from '@/components/ui'
import { aggregateDestinationsByCountry, getCountryStats } from '@/lib/countryAggregation'
import { DestinationRecommendation } from '@/services/apiClient'

interface OptimizedSearchResultsProps {
  results: DestinationRecommendation[]
  selectedTheme: string
  maxFlightTime?: number
  departureAirport: string
  onBack: () => void
  onExploreDestination: (destination: DestinationRecommendation) => void
  visaFreeOnly?: boolean
  onVisaFreeToggle?: () => void
}

// Memoized country card component
const MemoizedCountryCard = React.memo(CountryCard, (prevProps, nextProps) => {
  return (
    prevProps.aggregation.country.code === nextProps.aggregation.country.code &&
    prevProps.selectedTheme === nextProps.selectedTheme &&
    prevProps.maxFlightTime === nextProps.maxFlightTime &&
    prevProps.departureAirport === nextProps.departureAirport &&
    prevProps.index === nextProps.index &&
    prevProps.aggregation.destinations.length === nextProps.aggregation.destinations.length
  )
})

MemoizedCountryCard.displayName = 'MemoizedCountryCard'

export const OptimizedSearchResults = React.memo<OptimizedSearchResultsProps>(({
  results,
  selectedTheme,
  maxFlightTime,
  departureAirport,
  onBack,
  onExploreDestination,
  visaFreeOnly = false,
  onVisaFreeToggle
}) => {
  // Memoized country aggregations with expensive filtering
  const countryAggregations = useMemo(() => {
    console.log('🔄 Recalculating country aggregations...')
    
    let aggregations = aggregateDestinationsByCountry(results)
    
    if (visaFreeOnly) {
      aggregations = aggregations.filter(agg => agg.country.visaFree)
    }
    
    // Sort by relevance to selected theme
    aggregations.sort((a, b) => {
      const getThemeRelevance = (agg: any) => {
        return agg.destinations.reduce((sum: number, dest: any) => {
          const themeScore = dest.theme_scores?.[selectedTheme] || 0
          return sum + themeScore
        }, 0) / agg.destinations.length
      }
      
      return getThemeRelevance(b) - getThemeRelevance(a)
    })
    
    return aggregations
  }, [results, visaFreeOnly, selectedTheme])

  // Memoized country statistics
  const countryStats = useMemo(() => {
    console.log('📊 Recalculating country stats...')
    return getCountryStats(countryAggregations)
  }, [countryAggregations])

  // Memoized filter badge count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (visaFreeOnly) count++
    if (maxFlightTime && maxFlightTime < 12) count++
    return count
  }, [visaFreeOnly, maxFlightTime])

  // Optimized handlers with useCallback
  const handleBackClick = useCallback(() => {
    console.log('🔙 Navigating back to search')
    onBack()
  }, [onBack])

  const handleVisaFreeToggle = useCallback(() => {
    console.log('🛂 Toggling visa-free filter:', !visaFreeOnly)
    onVisaFreeToggle?.()
  }, [onVisaFreeToggle, visaFreeOnly])

  const handleExploreDestination = useCallback((destination: DestinationRecommendation) => {
    console.log('🌍 Exploring destination:', destination.destination.city_name)
    onExploreDestination(destination)
  }, [onExploreDestination])

  // Memoized loading check
  const isLoading = useMemo(() => results.length === 0, [results.length])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading destinations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                icon={<ArrowLeft size={20} />}
              >
                Back to Search
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {countryAggregations.length} Countries Found
                </h1>
                <p className="text-white/60 text-sm">
                  {countryStats.totalDestinations} destinations • From {departureAirport}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Active filters indicator */}
              {activeFiltersCount > 0 && (
                <Badge variant="info" size="sm" icon={<Filter size={12} />}>
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
                </Badge>
              )}
              
              {/* Visa-free toggle */}
              {onVisaFreeToggle && (
                <Button
                  variant="toggle"
                  size="sm"
                  selected={visaFreeOnly}
                  onClick={handleVisaFreeToggle}
                  icon={<Globe size={16} />}
                >
                  Visa-free only
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="container mx-auto px-4 py-8">
        {countryAggregations.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 max-w-md mx-auto">
              <Globe size={48} className="mx-auto text-white/40 mb-4" />
              <h3 className="text-white font-semibold mb-2">No Countries Found</h3>
              <p className="text-white/70 text-sm mb-4">
                No destinations match your current filters. Try adjusting your criteria.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
              >
                Modify Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {countryAggregations.map((aggregation, index) => (
              <MemoizedCountryCard
                key={`${aggregation.country.code}-${visaFreeOnly}`}
                aggregation={aggregation}
                selectedTheme={selectedTheme}
                maxFlightTime={maxFlightTime}
                departureAirport={departureAirport}
                index={index}
                onExplore={handleExploreDestination}
              />
            ))}
          </div>
        )}
      </div>

      {/* Performance Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono">
          <div>Countries: {countryAggregations.length}</div>
          <div>Destinations: {countryStats.totalDestinations}</div>
          <div>Filters: {activeFiltersCount}</div>
          <div>Theme: {selectedTheme}</div>
        </div>
      )}
    </div>
  )
})

OptimizedSearchResults.displayName = 'OptimizedSearchResults'