'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, ArrowRight, Calendar, MapPin, Plane, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { DestinationRecommendation } from '@/services/apiClient'

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

interface RedirectSuccessProps {
  destination: DestinationRecommendation
  flight: FlightOption
  activity?: any
  originAirport: string
  redirectProvider?: string
  onStartNewSearch: () => void
}

// Partner provider info
const getProviderInfo = (provider?: string) => {
  const providers: Record<string, { name: string; logo: string; color: string; trustBadge?: string }> = {
    'airline-BA': { name: 'British Airways', logo: '🇬🇧', color: 'blue', trustBadge: 'Official Airline' },
    'airline-LH': { name: 'Lufthansa', logo: '🇩🇪', color: 'yellow', trustBadge: 'Official Airline' },
    'airline-AF': { name: 'Air France', logo: '🇫🇷', color: 'blue', trustBadge: 'Official Airline' },
    'airline-KL': { name: 'KLM', logo: '🇳🇱', color: 'blue', trustBadge: 'Official Airline' },
    'kayak': { name: 'Kayak', logo: '🌊', color: 'orange', trustBadge: 'Trusted Partner' },
    'skyscanner': { name: 'Skyscanner', logo: '✈️', color: 'blue', trustBadge: 'Trusted Partner' },
    'travelpayouts': { name: 'Travel Aggregator', logo: '🌍', color: 'green', trustBadge: 'Travel Partner' }
  }
  
  return providers[provider || 'kayak'] || { name: 'Partner Site', logo: '✈️', color: 'blue', trustBadge: 'Booking Partner' }
}

export function RedirectSuccess({
  destination,
  flight,
  activity,
  originAirport,
  redirectProvider,
  onStartNewSearch
}: RedirectSuccessProps) {
  const [showTips, setShowTips] = useState(false)
  const providerInfo = getProviderInfo(redirectProvider)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <ExternalLink size={32} className="text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-blue-400">Redirected Successfully</h1>
              <p className="text-white/60 text-sm">Complete your booking on {providerInfo.name}</p>
            </div>
          </div>
          
          <div className="text-right flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
              {providerInfo.trustBadge}
            </div>
            <span className="text-2xl">{providerInfo.logo}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Status Message */}
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight size={40} className="text-blue-900" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Almost There!</h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              You've been redirected to {providerInfo.name} to complete your booking.
            </p>
            <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30 max-w-lg mx-auto">
              <div className="flex items-center space-x-2 text-blue-300">
                <CheckCircle size={20} />
                <span className="font-medium">Window should have opened automatically</span>
              </div>
              <p className="text-blue-200 text-sm mt-2">
                If not, please check for pop-up blockers or click the link below
              </p>
            </div>
          </div>

          {/* Flight Summary */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Plane size={20} className="text-blue-400" />
              <span>Your Selected Flight</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin size={16} className="text-white/60" />
                  <div>
                    <div className="text-white/60 text-sm">Route</div>
                    <div className="font-semibold">{originAirport} → {destination.destination.city_name}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock size={16} className="text-white/60" />
                  <div>
                    <div className="text-white/60 text-sm">Flight Time</div>
                    <div className="font-semibold">{flight.departureTime} - {flight.arrivalTime}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Plane size={16} className="text-white/60" />
                  <div>
                    <div className="text-white/60 text-sm">Airline & Duration</div>
                    <div className="font-semibold">{flight.airline} • {flight.duration}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">{flight.currency}{flight.price}</div>
                  <div className="text-white/60 text-sm">Starting from (per person)</div>
                  <div className="text-white/50 text-xs mt-1">
                    Final price may vary on {providerInfo.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Center */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <ExternalLink size={20} className="text-blue-400" />
              <span>Complete Your Booking</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{providerInfo.logo}</span>
                  <div>
                    <div className="font-semibold text-blue-300">{providerInfo.name}</div>
                    <div className="text-white/60 text-sm">{providerInfo.trustBadge} • Secure booking</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-blue-300">
                  <span className="text-sm">Opens in new tab</span>
                  <ExternalLink size={16} />
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={onStartNewSearch}
                  className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold px-8 py-3 rounded-lg hover:from-blue-300 hover:to-indigo-400 transition-all duration-300 flex items-center justify-center space-x-2 mx-auto"
                >
                  <Calendar size={16} />
                  <span>Search Another Flight</span>
                </button>
              </div>
            </div>
          </div>

          {/* Booking Tips */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <button 
              onClick={() => setShowTips(!showTips)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <AlertCircle size={20} className="text-yellow-400" />
                <span>Booking Tips</span>
              </h3>
              <div className={`transform transition-transform ${showTips ? 'rotate-180' : ''}`}>
                <ArrowRight size={20} className="text-white/60" />
              </div>
            </button>
            
            {showTips && (
              <div className="mt-4 space-y-3 text-white/80">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span>Complete your booking quickly - flight prices can change rapidly</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span>Check baggage policies and fees before confirming</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span>Consider adding travel insurance for peace of mind</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span>Double-check your passport validity and visa requirements</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Keep legacy name for compatibility but export the new component
export const BookingConfirmation = RedirectSuccess