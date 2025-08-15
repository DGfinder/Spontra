'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Plane, DollarSign, Users, Star, MapPin, TrendingDown, TrendingUp, Wifi, Monitor, Utensils, Zap, Luggage } from 'lucide-react'
import { ExplorationProgress } from './ExplorationProgress'
import { ErrorState } from './ErrorState'
import { getErrorMessage } from '@/lib/environment'
import { DestinationRecommendation } from '@/services/apiClient'
import { useFormData } from '@/store/searchStore'
import { getThemeColor, getThemeHoverColor, type ThemeKey } from '@/lib/theme'
import { AirlineLogo, AllianceBadge, AirlineRating } from './AirlineLogo'
import { getAirlineInfo, getFlightAmenities, getAirlineRating, getOnTimePerformance } from '@/data/airlines'
import { PriceBreakdown, FareClassSelector } from './PriceBreakdown'
import { AircraftInfo, AircraftBadge } from './AircraftInfo'
import { BookingComparison } from './BookingComparison'
import { LayoverDetails, generateLayoverInfo } from './LayoverDetails'

interface FlightOption {
  id: string
  price: number
  currency: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  airline: string
  aircraftType: string
  badge?: 'Best Overall' | 'Party Ready' | 'Early Explorer' | 'Weekend Perfect' | 'Budget Choice'
  arrivalContext: string
  bookingLink: string
  confidence: number
  fareClasses?: Array<{
    type: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
    price: number
    availability: number
  }>
  priceBreakdown?: {
    baseFare: number
    taxes: number
    fees: number
  }
}

interface FlightResultsProps {
  recommendation: DestinationRecommendation
  originAirport: string
  selectedActivity?: string
  onBack: () => void
  onFlightSelect?: (flight: FlightOption) => void
}

interface FlightCardProps {
  flight: FlightOption
  recommendation: DestinationRecommendation
  selectedActivity?: string
  isSelected?: boolean
  onClick?: () => void
}

function FlightCard({ flight, recommendation, selectedActivity, isSelected, onClick }: FlightCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showAmenities, setShowAmenities] = useState(false)
  
  const airlineInfo = getAirlineInfo(flight.airline)
  const amenities = getFlightAmenities(flight.airline)
  const rating = getAirlineRating(flight.airline)
  const onTimePerf = getOnTimePerformance(flight.airline)
  const layovers = generateLayoverInfo(flight.stops, 'Origin', recommendation.destination.city_name)
  
  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'Best Overall': return 'bg-gradient-to-r from-green-400 to-emerald-500'
      case 'Party Ready': return 'bg-gradient-to-r from-purple-400 to-pink-500'
      case 'Early Explorer': return 'bg-gradient-to-r from-orange-400 to-amber-500'
      case 'Weekend Perfect': return 'bg-gradient-to-r from-blue-400 to-cyan-500'
      case 'Budget Choice': return 'bg-gradient-to-r from-gray-400 to-gray-500'
      default: return 'bg-gradient-to-r from-yellow-400 to-orange-500'
    }
  }

  const getActivityIcon = () => {
    if (!selectedActivity) return '✈️'
    switch (selectedActivity) {
      case 'nightlife': return '🌃'
      case 'adventure': return '🏔️'
      case 'culture': return '🏛️'
      case 'food': return '🍽️'
      case 'nature': return '🌿'
      case 'shopping': return '🛍️'
      default: return '✈️'
    }
  }

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 transform hover:scale-105 ${
        isSelected ? 'scale-105 ring-2 ring-yellow-400' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Main Flight Card */}
      <div className="bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl hover:shadow-yellow-400/20 transition-all duration-300">
        
        {/* Badge */}
        {flight.badge && (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white mb-4 ${getBadgeColor(flight.badge)}`}>
            <Star size={12} className="mr-1" />
            {flight.badge}
          </div>
        )}

        {/* Header with Airline Logo and Price */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AirlineLogo iataCode={flight.airline} size="lg" showName={true} namePosition="right" />
            {airlineInfo?.alliance && (
              <AllianceBadge alliance={airlineInfo.alliance} size="sm" />
            )}
          </div>
          
          <div className="text-right">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg mb-2">
              {flight.currency}{flight.price}
            </div>
            <div className="text-white/80 text-sm">{getActivityIcon()} {selectedActivity}</div>
            <div className="text-white/60 text-xs mt-1">{flight.arrivalContext}</div>
          </div>
        </div>

        {/* Flight Times */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <div className="text-white font-semibold text-lg">{flight.departureTime}</div>
            <div className="text-white/60 text-xs">Departure</div>
          </div>
          
          <div className="flex-1 mx-4 relative">
            <div className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 rounded-full p-1">
              <Plane size={12} className="text-white" />
            </div>
            <div className="text-center mt-2">
              <div className="text-white/80 text-sm font-medium">{flight.duration}</div>
              <div className="text-white/60 text-xs">
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </div>
              {flight.stops > 0 && (
                <div className="mt-1">
                  <LayoverDetails layovers={layovers} compact={true} />
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-white font-semibold text-lg">{flight.arrivalTime}</div>
            <div className="text-white/60 text-xs">Arrival</div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="space-y-3">
          {/* Rating and Performance */}
          <div className="flex items-center justify-between">
            <AirlineRating rating={rating} onTimePerformance={onTimePerf} size="sm" />
            <AircraftInfo aircraftCode={flight.aircraftType} size="sm" showSpecs={true} />
          </div>
          
          {/* Amenities Preview */}
          {amenities && (
            <div className="flex items-center space-x-4 text-white/70 text-xs">
              {amenities.wifi && <div className="flex items-center space-x-1"><Wifi size={12} /><span>WiFi</span></div>}
              {amenities.entertainment && <div className="flex items-center space-x-1"><Monitor size={12} /><span>Entertainment</span></div>}
              {amenities.meals !== 'none' && <div className="flex items-center space-x-1"><Utensils size={12} /><span>Meals</span></div>}
              {amenities.power && <div className="flex items-center space-x-1"><Zap size={12} /><span>Power</span></div>}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAmenities(!showAmenities)
                }}
                className="text-yellow-400 hover:text-yellow-300 underline"
              >
                {showAmenities ? 'Less' : 'More'} info
              </button>
            </div>
          )}
          
          {/* Expanded Amenities */}
          {showAmenities && amenities && (
            <div className="bg-black/30 rounded-lg p-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-white/80">
                <div className="flex items-center space-x-1">
                  <Luggage size={12} />
                  <span>Carry-on: {amenities.baggage.carryOn}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Luggage size={12} />
                  <span>Checked: {amenities.baggage.checked}</span>
                </div>
                {amenities.seatPitch && (
                  <div className="col-span-2 text-white/60">
                    Seat pitch: {amenities.seatPitch}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hover Effects */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-2xl border border-yellow-400/40 transition-all duration-300" />
        )}
      </div>

      {/* Expanded Details on Hover */}
      {isHovered && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-w-md">
          <div className="text-white text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Confidence:</span>
              <span className="text-green-400 font-medium">{flight.confidence}% match</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Best for:</span>
              <span className="text-yellow-400">{flight.arrivalContext}</span>
            </div>

            {/* Fare Classes Preview */}
            {flight.fareClasses && flight.fareClasses.length > 1 && (
              <div className="border-t border-white/20 pt-3">
                <div className="text-white/70 text-xs mb-2">Available fare classes:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {flight.fareClasses.map((fare, idx) => (
                    <div key={idx} className="bg-white/10 rounded p-2">
                      <div className="font-medium text-white">{fare.type.replace('_', ' ')}</div>
                      <div className="text-yellow-400">{flight.currency}{fare.price}</div>
                      <div className="text-white/60">{fare.availability} seats</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Price Breakdown */}
            {flight.priceBreakdown && (
              <div className="border-t border-white/20 pt-3">
                <div className="text-white/70 text-xs mb-2">Price breakdown:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/70">Base fare:</span>
                    <span className="text-white">{flight.currency}{flight.priceBreakdown.baseFare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Taxes:</span>
                    <span className="text-white">{flight.currency}{flight.priceBreakdown.taxes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Fees:</span>
                    <span className="text-white">{flight.currency}{flight.priceBreakdown.fees}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Layover Information */}
            {flight.stops > 0 && layovers.length > 0 && (
              <div className="border-t border-white/20 pt-3">
                <div className="text-white/70 text-xs mb-2">Connection details:</div>
                <LayoverDetails layovers={layovers} compact={false} className="text-xs" />
              </div>
            )}
            
            {selectedActivity && (
              <div className="pt-2 border-t border-white/20">
                <span className="text-white/70 text-xs">Perfect timing for {selectedActivity} activities</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function FlightResults({ recommendation, originAirport, selectedActivity, onBack, onFlightSelect }: FlightResultsProps) {
  const [flights, setFlights] = useState<FlightOption[]>([])
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<{ message: string; type?: string } | null>(null)
  const [showPriceComparison, setShowPriceComparison] = useState(true)
  
  // Get form data for flight search
  const formData = useFormData()

  // Extract cached price from recommendation for comparison
  const cachedPrice = parseFloat((recommendation.estimated_flight_price || '0').replace(/[^0-9.-]/g, ''))

  // Fetch real flight options from our server route (Amadeus)
  const fetchFlightOptions = async (): Promise<FlightOption[]> => {
    console.log('🛫 Fetching real-time flights with form data:', formData)
    
    const res = await fetch('/api/amadeus/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: originAirport,
        destination: recommendation.destination.airport_code,
        departureDate: formData.departureDate || new Date().toISOString().slice(0,10),
        returnDate: formData.tripType === 'return' ? formData.returnDate : undefined,
        passengers: formData.passengers || 1,
        travelClass: 'ECONOMY', // Could be made configurable
        nonStop: false, // Could be made configurable
      }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Failed to fetch flights')
    
    console.log('✅ Real-time flights fetched:', json.data?.length || 0, 'options')
    return json.data as FlightOption[]
  }

  const handleRetry = () => {
    setError(null)
    let isActive = true
    setIsLoading(true)
    fetchFlightOptions()
      .then((flightOptions) => {
        if (!isActive) return
        setFlights(flightOptions)
        setError(null)
      })
      .catch((err) => {
        if (!isActive) return
        const errorInfo = getErrorMessage(err, 'Flight search')
        setError({ message: errorInfo.userMessage, type: errorInfo.type })
        setFlights([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })
  }

  useEffect(() => {
    handleRetry()
  }, [recommendation, selectedActivity])

  const handleFlightSelect = (flight: FlightOption) => {
    setSelectedFlight(flight)
    onFlightSelect?.(flight)
  }

  const getActivityTheme = () => {
    switch (selectedActivity) {
      case 'nightlife': return 'from-purple-900 via-pink-900 to-slate-900'
      case 'adventure': return 'from-orange-900 via-amber-900 to-slate-900'
      case 'culture': return 'from-blue-900 via-indigo-900 to-slate-900'
      case 'food': return 'from-green-900 via-emerald-900 to-slate-900'
      case 'nature': return 'from-green-900 via-teal-900 to-slate-900'
      case 'shopping': return 'from-pink-900 via-rose-900 to-slate-900'
      default: return 'from-slate-900 via-slate-800 to-slate-900'
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getActivityTheme()} text-white relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-radial from-white/5 to-transparent rounded-full"></div>
      </div>

      {/* Progress Indicator */}
      <ExplorationProgress 
        currentStep="flights"
        destination={recommendation.destination}
      />

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-white group px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${getThemeColor((selectedActivity || 'adventure') as ThemeKey)}1A` }}
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Activities</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${getThemeColor((selectedActivity || 'adventure') as ThemeKey)}, ${getThemeHoverColor((selectedActivity || 'adventure') as ThemeKey)})` }}>
              CHOOSE YOUR FLIGHT
            </h1>
            <p className="text-white/60 text-sm mt-2">
              {originAirport} → {recommendation.destination.city_name}, {recommendation.destination.country_name}
              {Boolean(selectedActivity) && <span className="ml-2">• For {selectedActivity} activities</span>}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-white/80 text-sm">Flight Duration</div>
            <div className="font-semibold" style={{ color: getThemeColor((selectedActivity || 'adventure') as ThemeKey) }}>
              ~{Math.round(recommendation.flight_route.total_duration_minutes / 60 * 10) / 10}h
            </div>
          </div>
        </div>
      </header>

      {/* Price Comparison Banner */}
      {showPriceComparison && cachedPrice > 0 && !isLoading && flights.length > 0 && (
        <div className="relative z-10 px-6 py-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-white/60 text-xs uppercase tracking-wider">Estimated Price</div>
                  <div className="text-yellow-400 font-bold text-lg">{recommendation.estimated_flight_price}</div>
                  <div className="text-white/40 text-xs">From destination search</div>
                </div>
                
                <ArrowLeft className="text-white/40 rotate-180" size={20} />
                
                <div className="text-center">
                  <div className="text-white/60 text-xs uppercase tracking-wider">Live Prices From</div>
                  <div className="text-green-400 font-bold text-lg">
                    €{Math.min(...flights.map(f => f.price))}
                  </div>
                  <div className="text-white/40 text-xs">Real-time search results</div>
                </div>
                
                {(() => {
                  const liveMin = Math.min(...flights.map(f => f.price))
                  const difference = liveMin - cachedPrice
                  const isLower = difference < 0
                  return (
                    <div className="flex items-center space-x-1">
                      {isLower ? (
                        <TrendingDown className="text-green-400" size={16} />
                      ) : (
                        <TrendingUp className="text-red-400" size={16} />
                      )}
                      <span className={`text-sm font-medium ${isLower ? 'text-green-400' : 'text-red-400'}`}>
                        {isLower ? '-' : '+'}€{Math.abs(difference).toFixed(0)}
                      </span>
                    </div>
                  )
                })()}
              </div>
              
              <button 
                onClick={() => setShowPriceComparison(false)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-white/50 text-xs">
                💡 Live prices are updated in real-time and may vary based on availability
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Instructions */}
          <div className="text-center mb-8">
            <p className="text-white/60 text-sm tracking-wider">
              Curated flight options • Optimized for your {selectedActivity || 'travel'} experience
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/80">Searching real-time flight prices...</p>
                <p className="text-white/50 text-sm mt-2">Getting live availability and pricing from airlines</p>
              </div>
            </div>
          )}

          {/* Flight Options Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  recommendation={recommendation}
                  selectedActivity={selectedActivity}
                  isSelected={selectedFlight?.id === flight.id}
                  onClick={() => handleFlightSelect(flight)}
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="mb-8">
              <ErrorState
                title="Unable to Load Flights"
                message={error.message}
                type={error.type as any}
                onRetry={handleRetry}
                retryLabel="Search Flights Again"
                className="bg-black/20 backdrop-blur-md border-white/20"
              />
            </div>
          )}

          {/* Book Selected Flight */}
          {selectedFlight && (
            <div className="mt-8">
              <div className="max-w-6xl mx-auto">
                {/* Flight Summary */}
                <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold">
                        €{selectedFlight.price}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-lg">
                          {selectedFlight.departureTime} → {selectedFlight.arrivalTime}
                        </div>
                        <div className="text-white/60">
                          {selectedFlight.airline} • {selectedFlight.duration} • {selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} stops`}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-8 py-3 rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105"
                      onClick={() => onFlightSelect?.(selectedFlight)}
                    >
                      Continue to Activities
                    </button>
                  </div>
                </div>

                {/* Booking Comparison */}
                <BookingComparison
                  airlineCode={selectedFlight.airline}
                  basePrice={selectedFlight.price}
                  currency={selectedFlight.currency}
                  flightId={selectedFlight.id}
                  onBookingSelect={(option) => {
                    // Open booking provider in new tab
                    window.open(option.url, '_blank', 'noopener,noreferrer')
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}