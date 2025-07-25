'use client'

import { useState } from 'react'
import { DestinationRecommendation } from '@/services/apiClient'

interface CountryConstellationProps {
  originAirport: string
  recommendations: DestinationRecommendation[]
  onCountryClick?: (recommendation: DestinationRecommendation) => void
}

interface CountryCircleProps {
  recommendation: DestinationRecommendation
  position: { x: number; y: number }
  onClick?: () => void
}

function CountryCircle({ recommendation, position, onClick }: CountryCircleProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const flightHours = Math.round(recommendation.flight_route.total_duration_minutes / 60 * 10) / 10

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 hover:scale-110 animate-in fade-in zoom-in duration-700"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        animationDelay: `${Math.random() * 0.3}s`, // Staggered entrance
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Country Circle */}
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-2 border-yellow-400 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-gradient-to-br hover:from-yellow-400/30 hover:to-orange-500/30 hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300">
          <div className="text-center">
            <div className="text-white font-semibold text-sm leading-tight">
              {recommendation.destination.country_name}
            </div>
            <div className="text-yellow-200 text-xs mt-0.5 leading-tight">
              {recommendation.destination.city_name}
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-black/90 backdrop-blur-sm text-white p-3 rounded-lg text-xs z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="font-semibold text-yellow-400 mb-1">
              {recommendation.destination.city_name}, {recommendation.destination.country_name}
            </div>
            
            <div className="space-y-1 text-white/90">
              <div className="flex justify-between">
                <span>Flight Time:</span>
                <span className="text-yellow-300">{flightHours}h</span>
              </div>
              
              {recommendation.estimated_flight_price && (
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="text-green-400">{recommendation.estimated_flight_price}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Match:</span>
                <span className="text-blue-400">{Math.round(recommendation.match_score)}%</span>
              </div>
              
              {recommendation.reason_for_recommendation && (
                <div className="mt-2 pt-2 border-t border-white/20 text-white/70">
                  {recommendation.reason_for_recommendation}
                </div>
              )}
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </div>
        )}
      </div>
    </div>
  )
}

function CentralOriginCircle({ originAirport }: { originAirport: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-500">
      <div className="w-28 h-28 bg-gradient-to-br from-white/15 to-gray-300/10 border-2 border-white/60 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
        <div className="text-center">
          <div className="text-white/80 text-xs mb-1 font-medium">Country of</div>
          <div className="text-white font-bold text-base">Origin</div>
          <div className="text-yellow-300 text-sm mt-1 font-semibold">{originAirport}</div>
        </div>
      </div>
    </div>
  )
}

export function CountryConstellation({ originAirport, recommendations, onCountryClick }: CountryConstellationProps) {
  // Calculate positions for countries in a constellation pattern
  const getConstellationPositions = (count: number) => {
    const positions = []
    const centerX = 50
    const centerY = 50
    
    if (count <= 4) {
      // Clean horizontal layout for 4 or fewer (matching template)
      const radius = 28
      const angles = [-45, 45, 135, 225] // diagonal pattern like template
      
      for (let i = 0; i < count; i++) {
        const angle = (angles[i] * Math.PI) / 180
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      }
    } else if (count <= 8) {
      // Symmetric circle pattern for 5-8 countries (matching template)
      const radius = 32
      
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2 // Start at top
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      }
    } else {
      // Two-ring constellation for 9+ countries (matching template)
      const innerRadius = 26
      const outerRadius = 38
      const innerCount = Math.min(6, Math.floor(count / 2))
      const outerCount = count - innerCount
      
      // Inner ring
      for (let i = 0; i < innerCount; i++) {
        const angle = (i * 2 * Math.PI) / innerCount - Math.PI / 2
        positions.push({
          x: centerX + innerRadius * Math.cos(angle),
          y: centerY + innerRadius * Math.sin(angle),
        })
      }
      
      // Outer ring - offset slightly for better visual balance
      for (let i = 0; i < outerCount; i++) {
        const angle = (i * 2 * Math.PI) / outerCount - Math.PI / 2 + Math.PI / outerCount
        positions.push({
          x: centerX + outerRadius * Math.cos(angle),
          y: centerY + outerRadius * Math.sin(angle),
        })
      }
    }
    
    return positions
  }

  const positions = getConstellationPositions(recommendations.length)

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="relative w-full h-full min-h-96">
      {/* Header */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <h3 className="text-white text-base font-medium text-center tracking-wide">
          FIND FLIGHTS TO YOUR COUNTRY OF DESTINATION
        </h3>
        <p className="text-white/60 text-xs text-center mt-2 tracking-wider">
          Hover over countries to see flight details
        </p>
      </div>

      {/* Central Origin Circle */}
      <CentralOriginCircle originAirport={originAirport} />

      {/* Destination Country Circles */}
      {recommendations.map((recommendation, index) => (
        <CountryCircle
          key={`${recommendation.destination.airport_code}-${index}`}
          recommendation={recommendation}
          position={positions[index]}
          onClick={() => onCountryClick?.(recommendation)}
        />
      ))}

      {/* Results Summary */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/40 backdrop-blur-sm text-white/80 px-6 py-2 rounded-full text-xs tracking-wide font-medium">
          {recommendations.length} DESTINATION{recommendations.length !== 1 ? 'S' : ''} FOUND
        </div>
      </div>
    </div>
  )
}