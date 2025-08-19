'use client'

import { CityCard, type CityOption } from './CityCard'
import { LoadingSkeleton } from '../LoadingSkeleton'

interface CityGridProps {
  cities: CityOption[]
  selectedTheme?: string
  onCitySelect: (city: CityOption) => void
  loading?: boolean
  error?: string
}

export function CityGrid({ 
  cities, 
  selectedTheme, 
  onCitySelect, 
  loading = false,
  error 
}: CityGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <LoadingSkeleton key={index} variant="card" className="h-80" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md mx-auto">
          <div className="text-red-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Error Loading Cities</h3>
          <p className="text-white/70 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (cities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 max-w-md mx-auto">
          <div className="text-white/60 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">No Cities Found</h3>
          <p className="text-white/70 text-sm">
            Try adjusting your filters or search criteria to find more destinations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cities.map((city) => (
        <CityCard
          key={city.id}
          city={city}
          selectedTheme={selectedTheme}
          onClick={() => onCitySelect(city)}
        />
      ))}
    </div>
  )
}