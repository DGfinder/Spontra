'use client'

import { useSearchStore, type Destination } from '@/lib/store'
import { SearchForm } from '@/components/SearchForm'

function SearchResults(): JSX.Element {
  const { destinations, isLoading, error, setCurrentStep } = useSearchStore()

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white/80 text-lg">Searching destinations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => setCurrentStep('search')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (destinations.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60 mb-4">No destinations found</p>
        <button
          onClick={() => setCurrentStep('search')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Search Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">
          {destinations.length} destination{destinations.length === 1 ? '' : 's'} found
        </h2>
        <button
          onClick={() => setCurrentStep('search')}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
        >
          New Search
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination: Destination) => (
          <div
            key={destination.id}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-all"
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              {destination.cityName}
            </h3>
            <p className="text-white/60 mb-2">{destination.countryName}</p>
            <p className="text-white/80 text-sm mb-4">
              {destination.description || 'Discover this amazing destination'}
            </p>
            {destination.flightDuration && (
              <p className="text-yellow-300 text-sm mb-2">
                ✈️ {destination.flightDuration}h flight
              </p>
            )}
            {destination.priceEstimate && (
              <p className="text-green-300 text-sm">
                💰 {destination.priceEstimate}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage(): JSX.Element {
  const { currentStep } = useSearchStore()

  return (
    <main className="min-h-screen">
      {currentStep === 'search' ? <SearchForm /> : <SearchResults />}
    </main>
  )
}