'use client'

import { HotelCard } from './HotelCard'
import { Button } from '../ui/Button'
import type { HotelSearchFilters } from '@/app/hotels/HotelsPageClient'

interface HotelResultsProps {
  hotels: any[]
  filters: HotelSearchFilters | null
  isLoading: boolean
  error: string | null
  onNewSearch: () => void
}

export function HotelResults({ hotels, filters, isLoading, error, onNewSearch }: HotelResultsProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md w-full text-center">
          <p className="text-white/90 text-lg mb-4">⚠️ {error}</p>
          <Button onClick={onNewSearch} variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (hotels.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md w-full text-center">
          <p className="text-white/90 text-lg mb-2">No hotels found</p>
          <p className="text-white/60 text-sm mb-6">Try searching for a different city or dates</p>
          <Button onClick={onNewSearch} variant="secondary">
            New Search
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {hotels.length} Hotel{hotels.length !== 1 ? 's' : ''} in {filters?.city}
            </h1>
            <p className="text-white/70 text-sm">
              {filters?.checkIn} → {filters?.checkOut} • {filters?.adults} guest{filters?.adults !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={onNewSearch} variant="ghost" size="sm">
            New Search
          </Button>
        </div>

        {/* Hotels Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {hotels.map((hotel, index) => (
            <HotelCard
              key={hotel.hotelId || index}
              hotel={hotel}
              checkIn={filters?.checkIn || ''}
              checkOut={filters?.checkOut || ''}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
