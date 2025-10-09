'use client'

import { useState } from 'react'
import { useSearchStore, type Destination } from '@/lib/store'
import { SearchForm } from '@/components/SearchForm'
import { SearchSummaryBar } from '@/components/SearchSummaryBar'
import { SearchEditDialog } from '@/components/SearchEditDialog'
import { CountryGrid } from '@/components/CountryGrid'
import { Button } from '@/components/ui/Button'
import { ArrowLeftIcon, MapPinIcon, ClockIcon, DollarSignIcon, BookmarkIcon, Heart } from 'lucide-react'
import { useUrlSync } from '@/lib/hooks/useUrlSync'
import { SearchResultsSkeleton, CountryGridSkeleton } from '@/components/ui/Skeleton'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useEffect } from 'react'

function SearchResults() {
  const { destinations, filters, isLoading, error, setCurrentStep, reset } = useSearchStore()
  const { user } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoritesMap, setFavoritesMap] = useState<Map<string, string>>(new Map()) // destinationId -> favoriteId

  // Fetch user's favorites on mount
  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/user/favorites', {
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        const favSet = new Set<string>()
        const favMap = new Map<string, string>()
        data.favorites.forEach((fav: any) => {
          favSet.add(fav.destinationId)
          favMap.set(fav.destinationId, fav.id)
        })
        setFavorites(favSet)
        setFavoritesMap(favMap)
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }

  const handleToggleFavorite = async (destinationId: string) => {
    if (!user) {
      toast.info('Please log in to save favorites')
      router.push('/login')
      return
    }

    const isFavorited = favorites.has(destinationId)

    if (isFavorited) {
      // Remove from favorites
      const favoriteId = favoritesMap.get(destinationId)
      if (!favoriteId) return

      try {
        const response = await fetch(`/api/user/favorites/${favoriteId}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        const data = await response.json()

        if (data.success) {
          const newFavorites = new Set(favorites)
          newFavorites.delete(destinationId)
          setFavorites(newFavorites)

          const newMap = new Map(favoritesMap)
          newMap.delete(destinationId)
          setFavoritesMap(newMap)

          toast.success('Removed from favorites')
        } else {
          toast.error('Failed to remove favorite')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    } else {
      // Add to favorites
      try {
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ destinationId }),
        })

        const data = await response.json()

        if (data.success) {
          const newFavorites = new Set(favorites)
          newFavorites.add(destinationId)
          setFavorites(newFavorites)

          const newMap = new Map(favoritesMap)
          newMap.set(destinationId, data.favorite.id)
          setFavoritesMap(newMap)

          toast.success('Added to favorites')
        } else {
          toast.error(data.error || 'Failed to add favorite')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    }
  }

  const handleSaveSearch = async () => {
    if (!user) {
      toast.info('Please log in to save searches')
      router.push('/login')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originAirport: filters.departureAirport,
          theme: filters.theme,
          minFlightTime: filters.minFlightTime,
          maxFlightTime: filters.maxFlightTime,
          priceAlertEnabled: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Search saved successfully!')
      } else {
        toast.error(data.error || 'Failed to save search')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <SearchResultsSkeleton />
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        title="Oops! Something went wrong"
        description={error}
        theme={filters.theme}
        primaryAction={{
          label: 'Try Again',
          onClick: () => setCurrentStep('search')
        }}
        secondaryAction={{
          label: 'Start Over',
          onClick: reset
        }}
      />
    )
  }

  if (destinations.length === 0) {
    return (
      <EmptyState
        type="no-results"
        title="No destinations found"
        description="We couldn't find any destinations matching your criteria. Try adjusting your filters or exploring different options."
        theme={filters.theme}
        primaryAction={{
          label: 'Adjust Search',
          onClick: () => setCurrentStep('search')
        }}
        secondaryAction={{
          label: 'Start Over',
          onClick: reset
        }}
      />
    )
  }

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentStep('search')}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {destinations.length} destination{destinations.length === 1 ? '' : 's'} found
              </h1>
              <p className="text-white/70">Perfect matches for your adventure</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveSearch}
              variant="secondary"
              size="sm"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <BookmarkIcon className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Search'}
            </Button>
            <Button
              onClick={reset}
              variant="secondary"
              size="sm"
            >
              New Search
            </Button>
          </div>
        </div>

        {/* Results Grid - Using v4.0 dynamic grid utilities */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination: Destination) => {
            const isFavorited = favorites.has(destination.id)

            return (
              <div
                key={destination.id}
                className="group bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20
                           hover:bg-white/15 hover:border-white/30 hover:scale-[1.02]
                           transition-all duration-300 transform-gpu shadow-xl hover:shadow-2xl relative"
              >
                {/* Favorite Button */}
                <button
                  onClick={() => handleToggleFavorite(destination.id)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-10"
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      isFavorited
                        ? 'fill-red-500 text-red-500'
                        : 'text-white/80 hover:text-white'
                    }`}
                  />
                </button>

                {/* Destination Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/95 transition-colors">
                    {destination.cityName}
                  </h3>
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="text-sm">{destination.country.name}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {destination.airportCode}
                    </span>
                  </div>
                </div>

              {/* Description */}
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                {destination.description || 'Discover this amazing destination and create unforgettable memories'}
              </p>

              {/* Metadata */}
              <div className="space-y-3">
                {destination.flightDuration && (
                  <div className="flex items-center gap-2 text-brand-blue">
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {destination.flightDuration}h flight
                    </span>
                  </div>
                )}

                {destination.priceEstimate && (
                  <div className="flex items-center gap-2 text-green-300">
                    <DollarSignIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {destination.priceEstimate}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full group-hover:shadow-lg"
                  onClick={() => {
                    const searchParams = new URLSearchParams()
                    if (filters.departureAirport) searchParams.set('from', filters.departureAirport)
                    if (filters.theme) searchParams.set('theme', filters.theme)
                    window.location.href = `/destinations/${destination.id}?${searchParams.toString()}`
                  }}
                >
                  Explore {destination.cityName}
                </Button>
              </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-white/70 mb-4">
              Don't see what you're looking for?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Button
                onClick={() => setCurrentStep('search')}
                variant="secondary"
                className="flex-1"
              >
                Refine Search
              </Button>
              <Button
                onClick={reset}
                variant="ghost"
                className="flex-1"
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Country Results View - Modern 2025 UI
 */
function CountryResults() {
  const {
    countryGroups,
    filters,
    isLoading,
    error,
    setCurrentStep,
    reset,
    search
  } = useSearchStore()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleExploreCountry = (countryCode: string) => {
    // Build URL with search context
    const searchParams = new URLSearchParams()
    searchParams.set('from', filters.departureAirport)
    searchParams.set('theme', filters.theme)
    searchParams.set('minTime', filters.minFlightTime.toString())
    searchParams.set('maxTime', filters.maxFlightTime.toString())
    searchParams.set('departure', filters.departureDate)
    searchParams.set('return', filters.returnDate)
    searchParams.set('passengers', filters.passengers.toString())

    // Navigate to country page with search context
    window.location.href = `/explore/${countryCode.toLowerCase()}?${searchParams.toString()}`
  }

  const handleEditSearch = (newFilters: typeof filters) => {
    // Apply new filters and re-search
    Object.entries(newFilters).forEach(([key, value]) => {
      useSearchStore.getState().updateFilter(key as keyof typeof filters, value)
    })
    search()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SearchSummaryBar
          filters={filters}
          onEdit={() => setIsEditDialogOpen(true)}
          theme={filters.theme}
        />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="animate-pulse">
                <div className="h-10 w-48 bg-white/10 rounded-lg mb-2"></div>
                <div className="h-5 w-32 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
          <CountryGridSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        title="Oops! Something went wrong"
        description={error}
        theme={filters.theme}
        primaryAction={{
          label: 'Try Again',
          onClick: () => setCurrentStep('search')
        }}
        secondaryAction={{
          label: 'Start Over',
          onClick: reset
        }}
      />
    )
  }

  if (countryGroups.length === 0) {
    return (
      <EmptyState
        type="no-results"
        title="No countries found"
        description="We couldn't find any countries matching your criteria. Try adjusting your flight time or departure airport."
        theme={filters.theme}
        primaryAction={{
          label: 'Adjust Search',
          onClick: () => setCurrentStep('search')
        }}
        secondaryAction={{
          label: 'Start Over',
          onClick: reset
        }}
      />
    )
  }

  return (
    <div className="min-h-screen">
      {/* Search Summary Bar (Sticky) */}
      <SearchSummaryBar
        filters={filters}
        onEdit={() => setIsEditDialogOpen(true)}
        theme={filters.theme}
      />

      {/* Progress Indicator */}
      <ProgressSteps currentStep="countries" theme={filters.theme} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Quick Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {countryGroups.length} {countryGroups.length === 1 ? 'Country' : 'Countries'}{' '}
                Found
              </h1>
              <p className="text-white/70">
                {countryGroups.reduce((sum, c) => sum + c.destinationCount, 0)} destinations •
                From $
                {Math.min(...countryGroups.map((c) => c.cheapestPrice)).toFixed(0)}
              </p>
            </div>

            <Button onClick={reset} variant="ghost" size="sm">
              New Search
            </Button>
          </div>
        </div>

        {/* Country Grid */}
        <CountryGrid
          countries={countryGroups}
          theme={filters.theme}
          onExplore={handleExploreCountry}
          isLoading={isLoading}
        />

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-white/70 mb-4">Don't see what you're looking for?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Button
                onClick={() => setIsEditDialogOpen(true)}
                variant="secondary"
                className="flex-1"
              >
                Refine Search
              </Button>
              <Button onClick={reset} variant="ghost" className="flex-1">
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Search Dialog */}
      <SearchEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        currentFilters={filters}
        onApply={handleEditSearch}
        isLoading={isLoading}
      />
    </div>
  )
}

export function HomePageClient() {
  const { currentStep } = useSearchStore()

  // Sync filters with URL parameters for shareable links
  useUrlSync()

  return (
    <main className="min-h-screen">
      {currentStep === 'search' && <SearchForm />}
      {currentStep === 'countries' && <CountryResults />}
      {currentStep === 'results' && <SearchResults />}
    </main>
  )
}
