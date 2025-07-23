'use client'

import { useState } from 'react'
import { CheckCircle, Download, Mail, Calendar, MapPin, Plane, Users, CreditCard, Clock } from 'lucide-react'

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
  badge?: string
  arrivalContext: string
  bookingLink: string
  confidence: number
}

interface BookingConfirmationProps {
  destination: DestinationRecommendation
  flight: FlightOption
  activity?: any
  originAirport: string
  onStartNewSearch: () => void
  onViewItinerary?: () => void
}

export function BookingConfirmation({
  destination,
  flight,
  activity,
  originAirport,
  onStartNewSearch,
  onViewItinerary
}: BookingConfirmationProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleDownloadItinerary = () => {
    setIsDownloading(true)
    // Simulate download delay
    setTimeout(() => {
      setIsDownloading(false)
      // In a real app, this would trigger a PDF download
      console.log('Downloading itinerary...')
    }, 2000)
  }

  const handleEmailItinerary = () => {
    setEmailSent(true)
    // Simulate email sending
    setTimeout(() => {
      setEmailSent(false)
    }, 3000)
  }

  const bookingId = `SPT${Date.now().toString().slice(-6)}`
  const totalPrice = flight.price + (activity ? 45 : 0) // Add activity cost if selected

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <CheckCircle size={32} className="text-green-400" />
            <div>
              <h1 className="text-2xl font-bold text-green-400">Booking Confirmed!</h1>
              <p className="text-white/60 text-sm">Your adventure awaits</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-white/80 text-sm">Booking Reference</div>
            <div className="text-green-400 font-bold text-lg">{bookingId}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Success Message */}
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-900" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Your Trip is Booked!</h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Get ready for an amazing {activity ? activity.category : 'travel'} experience in {destination.destination.city_name}, {destination.destination.country_name}
            </p>
          </div>

          {/* Booking Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Flight Details */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <Plane size={24} className="text-green-400" />
                <h3 className="text-xl font-bold">Flight Details</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Route</span>
                  <span className="font-semibold">{originAirport} → {destination.destination.airport_code}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Departure</span>
                  <span className="font-semibold">{flight.departureTime}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Arrival</span>
                  <span className="font-semibold">{flight.arrivalTime}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Duration</span>
                  <span className="font-semibold">{flight.duration}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Airline</span>
                  <span className="font-semibold">{flight.airline}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-white/20 pt-4">
                  <span className="text-white/70">Flight Price</span>
                  <span className="font-bold text-green-400">{flight.currency}{flight.price}</span>
                </div>
              </div>
            </div>

            {/* Destination & Activity */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin size={24} className="text-green-400" />
                <h3 className="text-xl font-bold">Destination</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">City</span>
                  <span className="font-semibold">{destination.destination.city_name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Country</span>
                  <span className="font-semibold">{destination.destination.country_name}</span>
                </div>
                
                {activity && (
                  <>
                    <div className="flex justify-between items-center border-t border-white/20 pt-4">
                      <span className="text-white/70">Activity</span>
                      <span className="font-semibold">{activity.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Category</span>
                      <span className="font-semibold capitalize">{activity.category}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Activity Price</span>
                      <span className="font-bold text-green-400">€45</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard size={24} className="text-green-400" />
                <div>
                  <h3 className="text-xl font-bold">Total Cost</h3>
                  <p className="text-white/70 text-sm">Including all fees and taxes</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">{flight.currency}{totalPrice}</div>
                <div className="text-white/60 text-sm">Per person</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleDownloadItinerary}
              disabled={isDownloading}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Itinerary</span>
                </>
              )}
            </button>

            <button
              onClick={handleEmailItinerary}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Mail size={16} />
              <span>{emailSent ? 'Email Sent!' : 'Email Itinerary'}</span>
            </button>

            <button
              onClick={onStartNewSearch}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-green-900 font-bold px-6 py-3 rounded-lg hover:from-green-300 hover:to-emerald-400 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Calendar size={16} />
              <span>Plan Another Trip</span>
            </button>
          </div>

          {/* Next Steps */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Clock size={20} className="text-green-400" />
              <span>What's Next?</span>
            </h3>
            
            <div className="space-y-3 text-white/80">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Check-in online 24 hours before your flight</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Arrive at the airport 2 hours before departure</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Download boarding passes to your mobile device</span>
              </div>
              {activity && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Your {activity.name} activity will be confirmed separately</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}