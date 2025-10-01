'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plane, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { SearchForm } from '@/components/SearchForm'
import { THEMES_DATA } from '@/components/server/ThemeBackgroundServer'

interface FlightOffer {
  id: string
  price: number
  currency: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  carrierCode: string
  flightNumber: string
  aircraftType: string
  deeplinkContext: {
    itineraryId: string
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
    adults: number
    cabinClass: string
    carrierCode: string
    flightNumber: string
    stops: number
    price?: number
    currency?: string
  }
}

function DirectFlightSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [flights, setFlights] = useState<FlightOffer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingStates, setBookingStates] = useState<{[key: string]: 'idle' | 'loading'}>({})

  // Check if we have search params to trigger automatic search
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departureDate = searchParams.get('departureDate')
  const hasSearchParams = origin && destination && departureDate

  // Automatic search on mount if params exist
  useEffect(() => {
    if (hasSearchParams) {
      performSearch({
        selectedTheme: 'discover', // Default theme for direct search
        departureAirport: origin!,
        destinationAirport: destination!,
        departureDate: departureDate!,
        returnDate: searchParams.get('returnDate') || undefined,
        passengers: parseInt(searchParams.get('passengers') || '1'),
        tripType: searchParams.get('returnDate') ? 'return' : 'one-way',
        cabinClass: (searchParams.get('cabinClass') as any) || 'ECONOMY'
      })
    }
  }, []) // Only run on mount

  const performSearch = async (formData: any) => {
    setIsSearching(true)
    setError(null)
    setFlights([])

    try {
      const response = await fetch('/api/amadeus/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: formData.departureAirport,
          destination: formData.destinationAirport,
          departureDate: formData.departureDate,
          returnDate: formData.returnDate,
          passengers: formData.passengers,
          travelClass: formData.cabinClass || 'ECONOMY',
          nonStop: false
        })
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to search flights')
      }

      setFlights(data.data || [])
    } catch (err) {
      console.error('Flight search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search flights')
    } finally {
      setIsSearching(false)
    }
  }

  const handleFormSubmit = async (formData: any) => {
    // Update URL with search params
    const params = new URLSearchParams({
      origin: formData.departureAirport,
      destination: formData.destinationAirport,
      departureDate: formData.departureDate,
      ...(formData.returnDate && { returnDate: formData.returnDate }),
      passengers: formData.passengers.toString(),
      cabinClass: formData.cabinClass || 'ECONOMY'
    })

    router.push(`/flights?${params.toString()}`, { scroll: false })
    await performSearch(formData)
  }

  const handleBookFlight = async (flight: FlightOffer) => {
    const key = flight.id
    setBookingStates(prev => ({...prev, [key]: 'loading'}))

    try {
      const response = await fetch('/api/redirect/flight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId: flight.deeplinkContext.itineraryId,
          origin: flight.deeplinkContext.origin,
          destination: flight.deeplinkContext.destination,
          departureDate: flight.deeplinkContext.departureDate,
          returnDate: flight.deeplinkContext.returnDate,
          adults: flight.deeplinkContext.adults,
          cabinClass: flight.deeplinkContext.cabinClass,
          carrierCode: flight.deeplinkContext.carrierCode,
          flightNumber: flight.deeplinkContext.flightNumber,
          stops: flight.deeplinkContext.stops,
          price: flight.deeplinkContext.price,
          currency: flight.deeplinkContext.currency
        })
      })

      const result = await response.json()

      if (result.ok && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      } else {
        throw new Error(result.error || 'Failed to create booking link')
      }
    } catch (err) {
      console.error('Booking redirect error:', err)
      // Fallback to generic search
      const fallbackUrl = `https://www.kayak.com/flights/${flight.deeplinkContext.origin}-${flight.deeplinkContext.destination}/${flight.deeplinkContext.departureDate}`
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setBookingStates(prev => ({...prev, [key]: 'idle'}))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-4 md:p-6">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Plane className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Direct Flight Search</h1>
              <p className="text-white/60 text-sm">Search flights to a specific destination</p>
            </div>
          </div>

          <div className="w-24" /> {/* Spacer for center alignment */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Form */}
        <div className="mb-8">
          <SearchForm
            themes={THEMES_DATA}
            onSubmit={handleFormSubmit}
            isLoading={isSearching}
          />
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
            <p className="text-white/80 text-lg">Searching flights...</p>
            <p className="text-white/50 text-sm mt-2">Getting live prices from airlines</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-6 text-center mb-8">
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={() => hasSearchParams && performSearch({
                selectedTheme: 'discover',
                departureAirport: origin!,
                destinationAirport: destination!,
                departureDate: departureDate!,
                returnDate: searchParams.get('returnDate') || undefined,
                passengers: parseInt(searchParams.get('passengers') || '1'),
                tripType: searchParams.get('returnDate') ? 'return' : 'one-way',
                cabinClass: (searchParams.get('cabinClass') as any) || 'ECONOMY'
              })}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Flight Results */}
        {!isSearching && !error && flights.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {flights.length} {flights.length === 1 ? 'flight' : 'flights'} found
              </h2>
              <p className="text-white/60 text-sm">
                {origin} → {destination} • {departureDate}
              </p>
            </div>

            {flights.map((flight) => {
              const isBooking = bookingStates[flight.id] === 'loading'

              return (
                <div
                  key={flight.id}
                  className="bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-black font-bold text-lg">{flight.currency}</div>
                          <div className="text-black font-bold text-xl">{flight.price}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-white font-semibold text-lg mb-1">
                          {flight.departureTime} → {flight.arrivalTime}
                        </div>
                        <div className="text-white/60 text-sm">
                          {flight.carrierCode} {flight.flightNumber} • {flight.duration}
                        </div>
                        <div className="text-white/50 text-xs mt-1">
                          {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`} • {flight.aircraftType}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookFlight(flight)}
                      disabled={isBooking}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-400 hover:to-emerald-500 transition-all flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Book Now</span>
                          <ExternalLink size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No Results */}
        {!isSearching && !error && flights.length === 0 && hasSearchParams && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No flights found</h3>
            <p className="text-white/60 mb-4">No flights available for your search criteria.</p>
            <p className="text-white/40 text-sm">Try different dates or check the destination airport code.</p>
          </div>
        )}

        {/* Empty State (No Search Yet) */}
        {!isSearching && !error && flights.length === 0 && !hasSearchParams && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready to search?</h3>
            <p className="text-white/60">Enter your travel details above to find available flights.</p>
          </div>
        )}
      </main>
    </div>
  )
}

// Main page component with Suspense boundary
export default function DirectFlightSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-lg">Loading flight search...</p>
        </div>
      </div>
    }>
      <DirectFlightSearchContent />
    </Suspense>
  )
}
