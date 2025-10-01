'use client'

import { useSearchStore } from '@/lib/store'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { Button } from './ui/Button'

export function SearchResults() {
  const { destinations, isLoading, error, setCurrentStep, resetFilters } = useSearchStore()

  const handleBack = () => {
    setCurrentStep('search')
  }

  const handleNewSearch = () => {
    resetFilters()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Finding amazing destinations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md">
          <p className="text-white/80 mb-4">{error}</p>
          <Button onClick={handleBack} variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Search
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Found {destinations.length} destinations
          </h1>
          <p className="text-white/70">
            Perfect matches for your adventure
          </p>
        </div>

        {destinations.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <p className="text-white/80 mb-4">
              No destinations found for your criteria. Try adjusting your search.
            </p>
            <Button onClick={handleNewSearch} variant="secondary">
              New Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {destination.cityName}
                  </h3>
                  <div className="flex items-center gap-1 text-white/70 text-sm">
                    <MapPin className="w-4 h-4" />
                    {destination.countryName}
                  </div>
                </div>

                {destination.description && (
                  <p className="text-white/80 text-sm mb-4 line-clamp-3">
                    {destination.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  {destination.flightDuration && (
                    <div className="flex items-center gap-1 text-white/70 text-sm">
                      <Clock className="w-4 h-4" />
                      {destination.flightDuration}h flight
                    </div>
                  )}
                  
                  {destination.priceEstimate && (
                    <div className="text-white font-medium text-sm">
                      {destination.priceEstimate}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-xs text-white/60 mb-2">Airport Code</div>
                  <div className="text-white font-mono text-sm">
                    {destination.airportCode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Button onClick={handleNewSearch} variant="secondary" size="lg">
            Start New Search
          </Button>
        </div>
      </div>
    </div>
  )
}