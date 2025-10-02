'use client'

import { useSearchStore, type Destination } from '@/lib/store'
import { SearchForm } from '@/components/SearchForm'
import { Button } from '@/components/ui/Button'
import { ArrowLeftIcon, MapPinIcon, ClockIcon, DollarSignIcon } from 'lucide-react'

function SearchResults() {
  const { destinations, isLoading, error, setCurrentStep, reset } = useSearchStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-white mb-2">Discovering amazing destinations...</h2>
          <p className="text-white/70">This will just take a moment</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-500/20 border border-red-400/30 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-red-200 mb-4">Oops! Something went wrong</h2>
            <p className="text-red-200/80 mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => setCurrentStep('search')}
                variant="secondary"
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={reset}
                variant="ghost"
                className="w-full"
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (destinations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">No destinations found</h2>
            <p className="text-white/70 mb-6">
              We couldn't find any destinations matching your criteria. Try adjusting your filters.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setCurrentStep('search')}
                variant="primary"
                className="w-full"
              >
                Adjust Search
              </Button>
              <Button
                onClick={reset}
                variant="ghost"
                className="w-full"
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
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
          
          <Button
            onClick={reset}
            variant="secondary"
            size="sm"
          >
            New Search
          </Button>
        </div>

        {/* Results Grid - Using v4.0 dynamic grid utilities */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination: Destination) => (
            <div
              key={destination.id}
              className="group bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 
                         hover:bg-white/15 hover:border-white/30 hover:scale-[1.02] 
                         transition-all duration-300 transform-gpu shadow-xl hover:shadow-2xl"
            >
              {/* Destination Header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/95 transition-colors">
                  {destination.cityName}
                </h3>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPinIcon className="h-4 w-4" />
                  <span className="text-sm">{destination.countryName}</span>
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
                    // TODO: Navigate to flight booking
                    console.log('Explore:', destination.cityName)
                  }}
                >
                  Explore {destination.cityName}
                </Button>
              </div>
            </div>
          ))}
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

export default function HomePage() {
  const { currentStep } = useSearchStore()

  return (
    <main className="min-h-screen">
      {currentStep === 'search' ? <SearchForm /> : <SearchResults />}
    </main>
  )
}