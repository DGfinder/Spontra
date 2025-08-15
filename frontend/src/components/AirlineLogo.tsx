'use client'

import { useState } from 'react'
import { getAirlineInfo } from '@/data/airlines'

interface AirlineLogoProps {
  iataCode: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showName?: boolean
  namePosition?: 'right' | 'bottom'
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
}

export function AirlineLogo({ 
  iataCode, 
  size = 'md', 
  className = '', 
  showName = false,
  namePosition = 'right'
}: AirlineLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  
  const airline = getAirlineInfo(iataCode)
  
  if (!airline) {
    // Fallback for unknown airlines
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-600 rounded flex items-center justify-center flex-shrink-0`}>
        <span className="text-white text-xs font-bold">
          {iataCode.substring(0, 2).toUpperCase()}
        </span>
      </div>
    )
  }

  const renderFallback = () => (
    <div 
      className={`${sizeClasses[size]} ${className} rounded flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: airline.brandColor || '#6B7280' }}
    >
      <span className="text-white text-xs font-bold">
        {iataCode.substring(0, 2).toUpperCase()}
      </span>
    </div>
  )

  const renderImage = () => (
    <div className={`${sizeClasses[size]} ${className} relative flex-shrink-0`}>
      {imageLoading && (
        <div 
          className={`${sizeClasses[size]} rounded animate-pulse bg-gray-300 absolute inset-0`}
        />
      )}
      <img
        src={airline.logoUrl}
        alt={`${airline.name} logo`}
        className={`${sizeClasses[size]} object-contain rounded ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
      />
    </div>
  )

  const logoElement = (!airline.logoUrl || imageError) ? renderFallback() : renderImage()

  if (!showName) {
    return logoElement
  }

  if (namePosition === 'bottom') {
    return (
      <div className="flex flex-col items-center space-y-1">
        {logoElement}
        <span className={`${textSizeClasses[size]} text-center font-medium text-white/90`}>
          {airline.shortName || airline.name}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {logoElement}
      <span className={`${textSizeClasses[size]} font-medium text-white/90`}>
        {airline.shortName || airline.name}
      </span>
    </div>
  )
}

// Alliance badge component
interface AllianceBadgeProps {
  alliance: 'star-alliance' | 'skyteam' | 'oneworld'
  size?: 'sm' | 'md'
  className?: string
}

export function AllianceBadge({ alliance, size = 'sm', className = '' }: AllianceBadgeProps) {
  const allianceNames = {
    'star-alliance': 'Star Alliance',
    'skyteam': 'SkyTeam', 
    'oneworld': 'oneworld'
  }

  const allianceColors = {
    'star-alliance': 'from-yellow-400 to-yellow-600',
    'skyteam': 'from-blue-400 to-blue-600',
    'oneworld': 'from-red-400 to-red-600'
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span 
      className={`inline-flex items-center rounded-full bg-gradient-to-r ${allianceColors[alliance]} text-white font-medium ${sizeClass} ${className}`}
    >
      ★ {allianceNames[alliance]}
    </span>
  )
}

// Airline rating component
interface AirlineRatingProps {
  rating: number
  onTimePerformance?: number
  size?: 'sm' | 'md'
  className?: string
}

export function AirlineRating({ rating, onTimePerformance, size = 'sm', className = '' }: AirlineRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-0.5">
        {stars.map((star) => (
          <svg
            key={star}
            className={`${starSize} ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className={`${textSize} text-white/80 font-medium`}>
        {rating.toFixed(1)}
      </span>
      {onTimePerformance && (
        <span className={`${textSize} text-white/60`}>
          • {onTimePerformance}% on-time
        </span>
      )}
    </div>
  )
}