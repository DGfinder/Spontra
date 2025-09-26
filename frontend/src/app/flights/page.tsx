'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plane, ArrowLeft, Search, ExternalLink } from 'lucide-react'

interface DirectFlightSearchParams {
  origin?: string
  destination?: string
  departureDate?: string
  returnDate?: string
  passengers?: string
  mode?: string
}

interface FlightOption {
  id: string
  itineraryId: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  travelClass: string
  price: number
  currency: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  carrierCode: string
  flightNumber: string
  aircraftType: string
  arrivalContext: string
  confidence: number
  priceBreakdown: {
    baseFare: number
    taxes: number
    fees: number
  }
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
  
  const [flights, setFlights] = useState<FlightOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingStates, setBookingStates] = useState<{[key: string]: 'idle' | 'loading' | 'error'}>({})

  // Extract query parameters
  const queryParams: DirectFlightSearchParams = {
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    passengers: searchParams.get('passengers') || '1',
    mode: searchParams.get('mode') || ''
  }

  const hasValidSearchParams = queryParams.origin && queryParams.destination && queryParams.departureDate

  // Search flights directly using Amadeus API
  const searchFlights = async () => {
    if (!hasValidSearchParams) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🛫 Searching direct flights:', queryParams)
      
      const response = await fetch('/api/amadeus/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: queryParams.origin,
          destination: queryParams.destination,
          departureDate: queryParams.departureDate,
          returnDate: queryParams.returnDate || undefined,
          passengers: parseInt(queryParams.passengers || '1'),
          travelClass: 'ECONOMY',
          nonStop: false
        })
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to search flights')
      }

      console.log('✅ Found', data.data?.length || 0, 'flights')
      setFlights(data.data || [])
    } catch (err) {
      console.error('❌ Flight search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search flights')
      setFlights([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle flight booking with provider redirect
  const handleBookFlight = async (flight: FlightOption, providerHint: string) => {
    const key = `${flight.id}-${providerHint}`
    setBookingStates(prev => ({...prev, [key]: 'loading'}))

    try {
      console.log('🔗 Creating booking redirect for:', providerHint)
      
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
        console.log('🚀 Redirecting to:', result.provider, result.url)
        window.open(result.url, '_blank', 'noopener,noreferrer')
        setBookingStates(prev => ({...prev, [key]: 'idle'}))
      } else {
        throw new Error(result.error || 'Failed to create booking link')
      }
    } catch (err) {
      console.error('❌ Booking redirect error:', err)
      setBookingStates(prev => ({...prev, [key]: 'error'}))
      
      // Fallback: construct a generic search URL
      const fallbackUrl = `https://www.kayak.com/flights/${flight.origin}-${flight.destination}/${flight.departureDate}`
      console.log('🔄 Using fallback URL:', fallbackUrl)
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
      
      // Reset state after showing error briefly
      setTimeout(() => {
        setBookingStates(prev => ({...prev, [key]: 'idle'}))
      }, 2000)
    }
  }

  // Search flights when component mounts or search params change
  useEffect(() => {
    if (hasValidSearchParams) {
      searchFlights()
    }
  }, [queryParams.origin, queryParams.destination, queryParams.departureDate, queryParams.returnDate, queryParams.passengers])

  // Show search form if no valid search parameters
  if (!hasValidSearchParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Plane className="w-8 h-8 text-black" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
              Direct Flight Search
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Search for flights directly without selecting a destination theme. 
              Enter your travel details to find the best available options.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Search Flights</h2>
                <p className="text-white/60 text-sm">
                  Enter your route and travel dates to get started
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">From</label>
                  <input
                    type="text"
                    placeholder="Origin airport (e.g., LHR)"
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-yellow-400"
                    value={queryParams.origin}
                    maxLength={3}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
                      const url = new URL(window.location.href)
                      if (value) {
                        url.searchParams.set('origin', value)
                      } else {
                        url.searchParams.delete('origin')
                      }
                      router.replace(url.toString(), { scroll: false })
                    }}
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">To</label>
                  <input
                    type="text"
                    placeholder="Destination airport (e.g., BCN)"
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-yellow-400"
                    value={queryParams.destination}
                    maxLength={3}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
                      const url = new URL(window.location.href)
                      if (value) {
                        url.searchParams.set('destination', value)
                      } else {
                        url.searchParams.delete('destination')
                      }
                      router.replace(url.toString(), { scroll: false })
                    }}
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Departure</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    value={queryParams.departureDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const url = new URL(window.location.href)
                      if (e.target.value) {
                        url.searchParams.set('departureDate', e.target.value)
                      } else {
                        url.searchParams.delete('departureDate')
                      }
                      router.replace(url.toString(), { scroll: false })
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Return (Optional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    value={queryParams.returnDate}
                    min={queryParams.departureDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const url = new URL(window.location.href)
                      if (e.target.value) {
                        url.searchParams.set('returnDate', e.target.value)
                      } else {
                        url.searchParams.delete('returnDate')
                      }
                      router.replace(url.toString(), { scroll: false })
                    }}
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Passengers</label>
                  <select
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    value={queryParams.passengers}
                    onChange={(e) => {
                      const url = new URL(window.location.href)
                      url.searchParams.set('passengers', e.target.value)
                      router.replace(url.toString(), { scroll: false })
                    }}
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-center">
                <p className="text-white/40 text-sm mb-4">
                  Example URL: /flights?origin=LHR&destination=BCN&departureDate=2025-09-27
                </p>
                <p className="text-white/50 text-xs">
                  You&rsquo;ll complete your purchase on a partner site.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show flight results
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">Flight Search Results</h1>
            <p className="text-white/60 text-sm">
              {queryParams.origin} → {queryParams.destination} • {queryParams.departureDate}
              {queryParams.returnDate && ` → ${queryParams.returnDate}`}
            </p>
          </div>

          <div className="text-right">
            <div className="text-white/60 text-sm">Passengers</div>
            <div className="font-semibold">{queryParams.passengers}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/80">Searching flights...</p>
            <p className="text-white/50 text-sm mt-2">Getting live prices from airlines</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-6 text-center mb-8">
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={searchFlights}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Flight Results */}
        {!isLoading && !error && flights.length > 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <p className="text-white/60 text-sm">
                Found {flights.length} flight option{flights.length > 1 ? 's' : ''} • Real-time pricing
              </p>
            </div>

            {flights.map((flight) => {
              const airlineKey = `${flight.id}-airline`
              const aggregatorKey = `${flight.id}-aggregator`
              
              return (
                <div
                  key={flight.id}
                  className="bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                        {flight.currency}{flight.price}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-lg">
                          {flight.departureTime} → {flight.arrivalTime}
                        </div>
                        <div className="text-white/60 text-sm">
                          {flight.carrierCode} {flight.flightNumber} • {flight.duration} • {flight.stops === 0 ? 'Direct' : `${flight.stops} stops`}
                        </div>
                        <div className="text-white/50 text-xs mt-1">
                          {flight.arrivalContext} • {flight.confidence}% match
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {/* Airline Direct Button */}
                      <button
                        onClick={() => handleBookFlight(flight, 'airline')}
                        disabled={bookingStates[airlineKey] === 'loading'}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-400 hover:to-emerald-500 transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        {bookingStates[airlineKey] === 'loading' ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Redirecting...</span>
                          </>
                        ) : (
                          <>
                            <span>Book Direct</span>
                            <ExternalLink size={14} />
                          </>
                        )}
                      </button>
                      
                      {/* Compare Prices Button */}
                      <button
                        onClick={() => handleBookFlight(flight, 'aggregator')}
                        disabled={bookingStates[aggregatorKey] === 'loading'}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        {bookingStates[aggregatorKey] === 'loading' ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>Compare Prices</span>
                            <ExternalLink size={14} />
                          </>
                        )}
                      </button>
                      
                      {/* Error States */}
                      {bookingStates[airlineKey] === 'error' && (
                        <p className="text-red-300 text-xs">Redirect failed, trying fallback</p>
                      )}
                      {bookingStates[aggregatorKey] === 'error' && (
                        <p className="text-red-300 text-xs">Redirect failed, trying fallback</p>
                      )}
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="grid grid-cols-3 gap-4 text-sm text-white/70 mb-4">
                    <div>
                      <span className="font-medium">Aircraft:</span> {flight.aircraftType}
                    </div>
                    <div>
                      <span className="font-medium">Route:</span> {flight.origin}-{flight.destination}
                    </div>
                    <div>
                      <span className="font-medium">Class:</span> {flight.travelClass}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {flight.priceBreakdown && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-4 text-xs text-white/60">
                        <div>Base fare: {flight.currency}{flight.priceBreakdown.baseFare}</div>
                        <div>Taxes & fees: {flight.currency}{flight.priceBreakdown.taxes + flight.priceBreakdown.fees}</div>
                        <div className="font-medium text-white/80">Total: {flight.currency}{flight.price}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && flights.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No flights found</h3>
            <p className="text-white/60 mb-4">No flights available for your search criteria.</p>
            <p className="text-white/40 text-sm">Try different dates, airports, or reduce the number of passengers.</p>
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
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/80">Loading flight search...</p>
        </div>
      </div>
    }>
      <DirectFlightSearchContent />
    </Suspense>
  )
}
