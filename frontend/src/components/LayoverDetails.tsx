'use client'

import { Clock, MapPin, Coffee, Wifi, ShoppingBag, Utensils, Car, Plane } from 'lucide-react'

export interface LayoverInfo {
  airport: {
    code: string
    name: string
    city: string
    country: string
    terminal?: string
  }
  duration: string
  durationMinutes: number
  arrivalTime: string
  departureTime: string
  isOvernight?: boolean
  facilities?: string[]
  transportOptions?: string[]
}

interface LayoverDetailsProps {
  layovers: LayoverInfo[]
  className?: string
  compact?: boolean
}

export function LayoverDetails({ layovers, className = '', compact = false }: LayoverDetailsProps) {
  if (layovers.length === 0) {
    return null
  }

  const getLayoverStatus = (minutes: number) => {
    if (minutes < 60) return { status: 'tight', color: 'text-red-400', label: 'Tight connection' }
    if (minutes < 120) return { status: 'adequate', color: 'text-yellow-400', label: 'Adequate time' }
    if (minutes < 360) return { status: 'comfortable', color: 'text-green-400', label: 'Comfortable' }
    return { status: 'long', color: 'text-blue-400', label: 'Extended layover' }
  }

  const getFacilityIcon = (facility: string) => {
    const icons: Record<string, JSX.Element> = {
      'wifi': <Wifi size={12} />,
      'restaurant': <Utensils size={12} />,
      'shopping': <ShoppingBag size={12} />,
      'lounge': <Coffee size={12} />,
      'transport': <Car size={12} />
    }
    return icons[facility.toLowerCase()] || <MapPin size={12} />
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {layovers.map((layover, index) => {
          const status = getLayoverStatus(layover.durationMinutes)
          return (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <Plane size={12} className="text-white/60" />
              <span className="text-white/80">
                {layover.duration} in {layover.airport.code}
              </span>
              <span className={`${status.color} font-medium`}>
                {status.label}
              </span>
              {layover.isOvernight && (
                <span className="text-purple-400">Overnight</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-white font-medium">Connection Details</h4>
      
      {layovers.map((layover, index) => {
        const status = getLayoverStatus(layover.durationMinutes)
        
        return (
          <div key={index} className="bg-black/20 border border-white/10 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Plane size={14} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-medium">
                    {layover.airport.name}
                  </div>
                  <div className="text-white/60 text-sm">
                    {layover.airport.city}, {layover.airport.country}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`${status.color} font-medium text-sm`}>
                  {status.label}
                </div>
                <div className="text-white/80 text-xs">
                  {layover.duration}
                </div>
              </div>
            </div>

            {/* Times */}
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-white/60" />
                <span className="text-white/80">Arrive: {layover.arrivalTime}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-white/60" />
                <span className="text-white/80">Depart: {layover.departureTime}</span>
              </div>
            </div>

            {/* Terminal Info */}
            {layover.airport.terminal && (
              <div className="flex items-center space-x-2 text-sm mb-3">
                <MapPin size={14} className="text-white/60" />
                <span className="text-white/80">Terminal {layover.airport.terminal}</span>
              </div>
            )}

            {/* Overnight Warning */}
            {layover.isOvernight && (
              <div className="bg-purple-500/10 border border-purple-400/20 rounded p-2 mb-3">
                <div className="text-purple-200 text-sm">
                  ⭐ Overnight connection - Consider booking airport hotel or city accommodation
                </div>
              </div>
            )}

            {/* Facilities */}
            {layover.facilities && layover.facilities.length > 0 && (
              <div className="border-t border-white/10 pt-3">
                <div className="text-white/60 text-xs mb-2">Available facilities:</div>
                <div className="flex flex-wrap gap-2">
                  {layover.facilities.map((facility, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 bg-white/10 text-white text-xs px-2 py-1 rounded"
                    >
                      {getFacilityIcon(facility)}
                      <span className="capitalize">{facility}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transport Options */}
            {layover.transportOptions && layover.transportOptions.length > 0 && layover.durationMinutes > 120 && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="text-white/60 text-xs mb-2">City transport options:</div>
                <div className="flex flex-wrap gap-2">
                  {layover.transportOptions.map((transport, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 bg-blue-500/10 text-blue-200 text-xs px-2 py-1 rounded"
                    >
                      <Car size={10} />
                      <span>{transport}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Connection Tips */}
            {layover.durationMinutes < 90 && (
              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded p-2 mt-3">
                <div className="text-yellow-200 text-xs">
                  ⚠️ Short connection time - Ensure you have boarding passes and check baggage transfer
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Generate sample layover data for flights with stops
export function generateLayoverInfo(stops: number, origin: string, destination: string): LayoverInfo[] {
  if (stops === 0) return []
  
  const layovers: LayoverInfo[] = []
  
  // Common European hub airports
  const hubs = [
    { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
    { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
    { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
    { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
    { code: 'ZUR', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
    { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria' }
  ]
  
  const facilities = ['WiFi', 'Restaurant', 'Shopping', 'Lounge', 'Duty Free']
  const transport = ['Train to city center', 'Bus service', 'Taxi available', 'Metro connection']
  
  for (let i = 0; i < stops; i++) {
    const hub = hubs[Math.floor(Math.random() * hubs.length)]
    const durationMinutes = Math.floor(Math.random() * 240) + 45 // 45min to 4h45min
    const isOvernight = durationMinutes > 360 && Math.random() > 0.7
    
    // Generate realistic times
    const arrivalHour = Math.floor(Math.random() * 24)
    const departureHour = (arrivalHour + Math.floor(durationMinutes / 60)) % 24
    
    layovers.push({
      airport: {
        ...hub,
        terminal: String.fromCharCode(65 + Math.floor(Math.random() * 3)) // A, B, or C
      },
      duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      durationMinutes,
      arrivalTime: `${arrivalHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      departureTime: `${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      isOvernight,
      facilities: facilities.slice(0, Math.floor(Math.random() * 3) + 2),
      transportOptions: durationMinutes > 120 ? transport.slice(0, Math.floor(Math.random() * 2) + 1) : undefined
    })
  }
  
  return layovers
}