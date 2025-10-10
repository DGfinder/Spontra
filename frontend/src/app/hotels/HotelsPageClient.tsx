'use client'

import { useState } from 'react'
import { HotelSearchPanel } from '@/components/hotels/HotelSearchPanel'
import { HotelResults } from '@/components/hotels/HotelResults'
import { searchHotels } from '@/app/actions/travelpayouts'

export interface HotelSearchFilters {
  city: string
  checkIn: string
  checkOut: string
  adults: number
}

export function HotelsPageClient() {
  const [hasSearched, setHasSearched] = useState(false)
  const [searchFilters, setSearchFilters] = useState<HotelSearchFilters | null>(null)
  const [hotels, setHotels] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (filters: HotelSearchFilters) => {
    setIsLoading(true)
    setError(null)
    setSearchFilters(filters)

    try {
      const result = await searchHotels({
        location: filters.city,
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        adults: filters.adults,
        limit: 20
      })

      if (result.success && result.data?.hotels) {
        setHotels(result.data.hotels)
        setHasSearched(true)
      } else {
        setError(result.error || 'No hotels found')
        setHotels([])
        setHasSearched(true)
      }
    } catch (err) {
      console.error('[Hotels] Search error:', err)
      setError('Failed to search hotels. Please try again.')
      setHotels([])
      setHasSearched(true) // Show error message
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen">
      {/* Fixed Atmospheric Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/backgrounds/discover-background.jpg')",
          zIndex: -2
        }}
      />

      {/* Dark Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: -1 }}
      />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Search Panel - Left Aligned */}
        <div className="flex items-start justify-start min-h-screen
                        pl-[clamp(1rem,3vw,2rem)] pt-[clamp(2rem,4vh,3rem)]
                        sm:pl-[clamp(1.5rem,3vw,2.5rem)] sm:pt-[clamp(2.5rem,5vh,4rem)]
                        md:pl-[clamp(2rem,3vw,3rem)] md:pt-[clamp(3rem,5vh,4.5rem)]
                        lg:pl-[clamp(2.5rem,4vw,4rem)] lg:pt-[clamp(3rem,6vh,5rem)]
                        xl:pl-[clamp(3.5rem,6vw,6rem)] xl:pt-[clamp(3rem,6vh,6rem)]
                        2xl:pl-[clamp(4rem,6vw,7rem)] 2xl:pt-[clamp(3rem,6vh,6rem)]">

          <HotelSearchPanel
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>

        {/* Results Section */}
        {hasSearched && (
          <HotelResults
            hotels={hotels}
            filters={searchFilters}
            isLoading={isLoading}
            error={error}
            onNewSearch={() => setHasSearched(false)}
          />
        )}
      </div>
    </main>
  )
}
