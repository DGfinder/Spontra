'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Plane, DollarSign, Users, Star, MapPin } from 'lucide-react'
import { ExplorationProgress } from './ExplorationProgress'

interface DestinationRecommendation {
  destination: {
    city_name: string
    country_name: string
    airport_code: string
  }
  flight_route: {
    total_duration_minutes: number
  }
  match_score: number
  estimated_flight_price?: string
  reason_for_recommendation?: string
}

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

        {/* Price Circle */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg">
            {flight.currency}{flight.price}
          </div>
          
          <div className="text-right">
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
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-white font-semibold text-lg">{flight.arrivalTime}</div>
            <div className="text-white/60 text-xs">Arrival</div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-white/80">
            <Users size={14} />
            <span>{flight.airline}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-white/80">
            <MapPin size={14} />
            <span>{flight.aircraftType}</span>
          </div>
        </div>

        {/* Hover Effects */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-2xl border border-yellow-400/40 transition-all duration-300" />
        )}
      </div>

      {/* Expanded Details on Hover */}
      {isHovered && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-white text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">Confidence:</span>
              <span className="text-green-400 font-medium">{flight.confidence}% match</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Best for:</span>
              <span className="text-yellow-400">{flight.arrivalContext}</span>
            </div>
            
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

  // Sample flight data - in real implementation, this would come from Amadeus API
  const generateFlightOptions = (): FlightOption[] => {
    const basePrice = 220
    const destination = recommendation.destination
    
    return [
      {
        id: 'flight-1',
        price: basePrice + 50,
        currency: '€',
        departureTime: '08:15',
        arrivalTime: '11:30',
        duration: '3h 15m',
        stops: 0,
        airline: 'EuroWings',
        aircraftType: 'A320',
        badge: 'Best Overall',
        arrivalContext: 'Perfect for morning exploration',
        bookingLink: 'https://www.eurowings.com/booking/search',
        confidence: 95
      },
      {
        id: 'flight-2', 
        price: basePrice + 80,
        currency: '€',
        departureTime: '14:30',
        arrivalTime: '17:45',
        duration: '3h 15m',
        stops: 0,
        airline: 'Lufthansa',
        aircraftType: 'A319',
        badge: selectedActivity === 'nightlife' ? 'Party Ready' : 'Weekend Perfect',
        arrivalContext: selectedActivity === 'nightlife' ? 'Arrives in time for evening festivities' : 'Great for weekend breaks',
        bookingLink: 'https://www.lufthansa.com/booking',
        confidence: 92
      },
      {
        id: 'flight-3',
        price: basePrice - 30,
        currency: '€', 
        departureTime: '06:45',
        arrivalTime: '11:20',
        duration: '4h 35m',
        stops: 1,
        airline: 'Ryanair',
        aircraftType: 'B737',
        badge: 'Budget Choice',
        arrivalContext: 'Early start, full day ahead',
        bookingLink: 'https://www.ryanair.com/gb/en/book',
        confidence: 78
      },
      {
        id: 'flight-4',
        price: basePrice + 120,
        currency: '€',
        departureTime: '19:20',
        arrivalTime: '22:35',
        duration: '3h 15m',
        stops: 0,
        airline: 'KLM',
        aircraftType: 'E190',
        badge: selectedActivity === 'adventure' ? 'Early Explorer' : undefined,
        arrivalContext: selectedActivity === 'adventure' ? 'Rest tonight, adventure tomorrow' : 'Evening arrival, night in the city',
        bookingLink: 'https://www.klm.com/booking',
        confidence: 85
      }
    ]
  }

  useEffect(() => {
    setIsLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      const flightOptions = generateFlightOptions()
      setFlights(flightOptions)
      setIsLoading(false)
    }, 1500)
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
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Activities</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              CHOOSE YOUR FLIGHT
            </h1>
            <p className="text-white/60 text-sm mt-2">
              {originAirport} → {recommendation.destination.city_name}, {recommendation.destination.country_name}
              {selectedActivity && <span className="ml-2">• For {selectedActivity} activities</span>}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-white/80 text-sm">Flight Duration</div>
            <div className="text-yellow-400 font-semibold">
              ~{Math.round(recommendation.flight_route.total_duration_minutes / 60 * 10) / 10}h
            </div>
          </div>
        </div>
      </header>

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
                <p className="text-white/80">Finding the best flights for your journey...</p>
              </div>
            </div>
          )}

          {/* Flight Options Grid */}
          {!isLoading && (
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

          {/* Book Selected Flight */}
          {selectedFlight && (
            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/20 p-6 z-50">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold">
                    €{selectedFlight.price}
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {selectedFlight.departureTime} → {selectedFlight.arrivalTime}
                    </div>
                    <div className="text-white/60 text-sm">
                      {selectedFlight.airline} • {selectedFlight.duration}
                    </div>
                  </div>
                </div>
                
                <button 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-8 py-3 rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    // Simulate realistic booking flow
                    const bookingUrl = selectedFlight.bookingLink
                    if (bookingUrl.includes('example.com')) {
                      // For demo purposes, proceed to confirmation
                      onFlightSelect?.(selectedFlight)
                    } else {
                      // Open real airline website in new tab
                      window.open(bookingUrl, '_blank', 'noopener,noreferrer')
                      // Still proceed to confirmation for demo
                      setTimeout(() => onFlightSelect?.(selectedFlight), 1000)
                    }
                  }}
                >
                  Book & Plan Activities
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}