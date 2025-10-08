'use client'

import { useState, useEffect } from 'react'
import { X, Plane, Calendar, Users, ArrowRight, Hotel, Loader2 } from 'lucide-react'
import { searchAviasalesFlights, generateAviasalesLink, trackAviasalesClick } from '@/app/actions/travelpayouts'
import { searchHotels } from '@/app/actions/travelpayouts'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  origin: string
  destination: string
  cityName: string
  departureDate?: string
}

export function BookingModal({
  isOpen,
  onClose,
  origin,
  destination,
  cityName,
  departureDate
}: BookingModalProps) {
  const [flights, setFlights] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [loadingFlights, setLoadingFlights] = useState(true)
  const [loadingHotels, setLoadingHotels] = useState(false)
  const [showHotels, setShowHotels] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<any>(null)

  useEffect(() => {
    if (!isOpen) return

    async function fetchFlights() {
      setLoadingFlights(true)
      try {
        const result = await searchAviasalesFlights({
          origin,
          destination,
          departureDate: departureDate || getDefaultDepartureDate(),
          adults: 1
        })

        if (result.success && result.data?.flights) {
          setFlights(result.data.flights.slice(0, 5))
        }
      } catch (err) {
        console.error('Error fetching flights:', err)
      } finally {
        setLoadingFlights(false)
      }
    }

    fetchFlights()
  }, [isOpen, origin, destination, departureDate])

  async function handleShowHotels() {
    setShowHotels(true)
    setLoadingHotels(true)

    try {
      const checkIn = departureDate || getDefaultDepartureDate()
      const checkOut = getCheckoutDate(checkIn)

      const result = await searchHotels({
        location: cityName,
        checkIn,
        checkOut,
        adults: 1,
        limit: 5
      })

      if (result.success && result.data?.hotels) {
        setHotels(result.data.hotels)
      }
    } catch (err) {
      console.error('Error fetching hotels:', err)
    } finally {
      setLoadingHotels(false)
    }
  }

  function handleBookFlight(flight: any) {
    const link = generateAviasalesLink({
      origin,
      destination,
      departureDate: departureDate || getDefaultDepartureDate(),
      adults: 1
    })

    // Track click
    trackAviasalesClick({
      sessionId: getSessionId(),
      originAirport: origin,
      destinationAirport: destination,
      departureDate: departureDate || getDefaultDepartureDate(),
      displayedPrice: flight.price,
      clickUrl: link,
      variant: 'aviasales'
    })

    // Open in new tab
    window.open(link, '_blank')

    setSelectedFlight(flight)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gradient-to-br from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f1419]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Book Your Trip to {cityName}</h2>
                <p className="text-white/60 text-sm mt-1">
                  {origin} → {destination} • {formatDate(departureDate || getDefaultDepartureDate())}
                </p>
              </div>

              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
            {/* Flights Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-5 h-5 text-brand-blue" />
                <h3 className="text-xl font-semibold text-white">Available Flights</h3>
              </div>

              {loadingFlights ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                </div>
              ) : flights.length > 0 ? (
                <div className="space-y-3">
                  {flights.map((flight, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Flight info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-semibold text-lg">
                              ${flight.price}
                            </span>
                            {flight.isDirect && (
                              <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full font-medium">
                                Direct
                              </span>
                            )}
                            {!flight.isDirect && (
                              <span className="text-white/50 text-xs">
                                {flight.transfers} stop{flight.transfers > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-white/60 text-sm">
                            <span>{flight.airline}</span>
                            <span>•</span>
                            <span>{formatDuration(flight.duration)}</span>
                          </div>
                        </div>

                        {/* Book button */}
                        <button
                          onClick={() => handleBookFlight(flight)}
                          className="bg-brand-blue hover:bg-brand-blue/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
                        >
                          Book Flight
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-white/60">No flights found for this route</p>
                </div>
              )}
            </div>

            {/* Hotel upsell */}
            {!showHotels && selectedFlight && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Hotel className="w-5 h-5 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white">Add a Hotel?</h3>
                    </div>
                    <p className="text-white/70 text-sm mb-4">
                      Save up to 15% by booking your flight + hotel together
                    </p>
                    <p className="text-white/50 text-xs">
                      💰 Hotels earn 30% commission vs 2% for flights
                    </p>
                  </div>

                  <button
                    onClick={handleShowHotels}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-2 whitespace-nowrap"
                  >
                    View Hotels
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Hotels Section */}
            {showHotels && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Hotel className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Hotels in {cityName}</h3>
                </div>

                {loadingHotels ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                ) : hotels.length > 0 ? (
                  <div className="space-y-3">
                    {hotels.map((hotel, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1">{hotel.hotelName}</h4>
                            <div className="flex items-center gap-3 text-white/60 text-sm">
                              <span>From ${hotel.priceFrom}/night</span>
                              {hotel.stars > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{'⭐'.repeat(hotel.stars)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (hotel.link) {
                                window.open(hotel.link, '_blank')
                              }
                            }}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
                          >
                            View Hotel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-white/60">No hotels found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Helper functions
function getDefaultDepartureDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

function getCheckoutDate(checkIn: string): string {
  const date = new Date(checkIn)
  date.setDate(date.getDate() + 3) // 3 night stay
  return date.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem('spontra_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('spontra_session_id', sessionId)
  }
  return sessionId
}
