'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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

function CountryCircle({ recommendation, position, onClick }: CountryCircleProps & { index?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const flightHours = Math.round(recommendation.flight_route.total_duration_minutes / 60 * 10) / 10

  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -6, 0], // Subtle floating effect
      }}
      transition={{
        opacity: { duration: 0.5 },
        scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }, // Bouncy spring
        y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }
      }}
      whileHover={{ 
        scale: 1.15,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Country Circle with glow */}
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-yellow-400/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ filter: 'blur(8px)' }}
        />
        
        <motion.div 
          className="relative w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-2 border-yellow-400 rounded-full flex items-center justify-center backdrop-blur-sm"
          whileHover={{
            background: 'linear-gradient(to bottom right, rgba(250, 204, 21, 0.3), rgba(249, 115, 22, 0.3))',
            borderColor: 'rgb(253, 224, 71)',
            boxShadow: '0 0 30px rgba(250, 204, 21, 0.4)',
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center">
            <div className="text-white font-semibold text-sm leading-tight">
              {recommendation.destination.country_name}
            </div>
            <div className="text-yellow-200 text-xs mt-0.5 leading-tight">
              {recommendation.destination.city_name}
            </div>
          </div>
        </motion.div>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-black/90 backdrop-blur-sm text-white p-3 rounded-lg text-xs z-50"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function CentralOriginCircle({ originAirport }: { originAirport: string }) {
  return (
    <motion.div 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.34, 1.56, 0.64, 1] // Bouncy effect
      }}
    >
      {/* Pulse ring effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white/30"
        animate={{
          scale: [1, 1.4, 1.4],
          opacity: [0.6, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      
      <motion.div 
        className="w-28 h-28 bg-gradient-to-br from-white/15 to-gray-300/10 border-2 border-white/60 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg"
        whileHover={{
          scale: 1.05,
          boxShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center">
          <div className="text-white/80 text-xs mb-1 font-medium">Country of</div>
          <div className="text-white font-bold text-base">Origin</div>
          <motion.div 
            className="text-yellow-300 text-sm mt-1 font-semibold"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {originAirport}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
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

  // Generate background stars
  const stars = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    })),
  [])

  // Show loading or empty state instead of null
  if (recommendations.length === 0) {
    return (
      <motion.div 
        className="relative w-full h-full min-h-96 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center text-white/60">
          <div className="text-lg mb-2">No destinations found</div>
          <div className="text-sm">Try adjusting your search criteria</div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="relative w-full h-full min-h-96 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div 
        className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-white text-base font-medium text-center tracking-wide">
          FIND FLIGHTS TO YOUR COUNTRY OF DESTINATION
        </h3>
        <p className="text-white/60 text-xs text-center mt-2 tracking-wider">
          Hover over countries to see flight details
        </p>
      </motion.div>

      {/* Central Origin Circle */}
      <CentralOriginCircle originAirport={originAirport} />

      {/* Destination Country Circles */}
      <AnimatePresence>
        {recommendations.map((recommendation, index) => (
          <CountryCircle
            key={`${recommendation.destination.airport_code}-${index}`}
            recommendation={recommendation}
            position={positions[index]}
            onClick={() => onCountryClick?.(recommendation)}
          />
        ))}
      </AnimatePresence>

      {/* Results Summary */}
      <motion.div 
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div 
          className="bg-black/40 backdrop-blur-sm text-white/80 px-6 py-2 rounded-full text-xs tracking-wide font-medium"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {recommendations.length} DESTINATION{recommendations.length !== 1 ? 'S' : ''} FOUND
        </motion.div>
      </motion.div>
    </motion.div>
  )
}