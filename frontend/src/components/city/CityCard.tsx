'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { MapPin, Star, Info } from 'lucide-react'
import { Card, Badge, ThemeBadge } from '@/components/ui'
import { getThemeColor } from '@/lib/theme'
import { formatCurrency, formatDuration } from '@/lib/utils'

export interface CityOption {
  id: string
  name: string
  airport_code: string
  population: number
  flight_frequency: number
  primary_theme: 'party' | 'adventure' | 'learn' | 'shopping' | 'nature' | 'culture' | 'food' | 'nightlife' | 'nature'
  secondary_themes: Array<{
    theme: 'party' | 'adventure' | 'learn' | 'shopping' | 'nature' | 'culture' | 'food' | 'nightlife' | 'nature'
    strength: number
  }>
  is_hidden_gem: boolean
  estimated_price: string
  flight_duration: number
  description: string
  themeScores?: {
    party: number
    adventure: number
    learn: number
    shopping: number
    beach: number
  }
  highlights?: string[]
  bestMonths?: string[]
  countryName: string
  countryCode: string
}

interface CityCardProps {
  city: CityOption
  selectedTheme?: string
  onClick: () => void
  index?: number // For staggered animations
}

// Theme icon mapping
const getThemeIcon = (theme: string) => {
  const iconMap: Record<string, string> = {
    party: '🌃',
    nightlife: '🌃',
    adventure: '🏔️',
    learn: '🏛️',
    culture: '🏛️',
    shopping: '🛍️',
    beach: '🏖️',
    food: '🍽️',
    nature: '🌿'
  }
  return iconMap[theme] || '✈️'
}

// Theme color mapping
const getThemeColorClass = (theme: string) => {
  const colorMap: Record<string, string> = {
    party: 'text-purple-400',
    nightlife: 'text-purple-400',
    adventure: 'text-orange-400',
    learn: 'text-blue-400',
    culture: 'text-blue-400',
    shopping: 'text-pink-400',
    beach: 'text-cyan-400',
    food: 'text-green-400',
    nature: 'text-emerald-400'
  }
  return colorMap[theme] || 'text-yellow-400'
}

export function CityCard({ city, selectedTheme, onClick, index = 0 }: CityCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const relevantSecondaryThemes = city.secondary_themes
    .filter(t => t.strength >= 0.3)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)

  const isSelectedTheme = selectedTheme === city.primary_theme

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDetails(!showDetails)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <motion.div
      className="group cursor-pointer w-full max-w-sm"
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
    >
      <motion.div
        className={`
          relative p-6 rounded-xl overflow-hidden
          bg-black/40 backdrop-blur-sm border border-white/20
          shadow-lg shadow-black/10
          ${isSelectedTheme ? 'ring-2 ring-yellow-400/60 ring-offset-2 ring-offset-transparent' : ''}
        `}
        whileHover={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          borderColor: 'rgba(255, 255, 255, 0.4)',
          background: 'linear-gradient(to bottom right, rgba(255,255,255,0.15), rgba(255,255,255,0.08))'
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Hidden Gem Badge */}
        {city.is_hidden_gem && (
          <div className="absolute -top-3 -right-3 z-10">
            <Badge
              variant="warning"
              size="sm"
              rounded
              icon={<Star size={12} fill="currentColor" />}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg backdrop-blur-sm"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold">
                Hidden Gem
              </span>
            </Badge>
          </div>
        )}

        {/* City Header */}
        <div className="text-center mb-4">
          <h3 className="text-white font-light text-xl tracking-wide leading-tight mb-1">
            {city.name}
          </h3>
          <div className="flex items-center justify-center space-x-2 text-white/60">
            <MapPin size={12} />
            <span className="text-sm font-medium tracking-wider uppercase">
              {city.airport_code}
            </span>
          </div>
        </div>

        {/* Flight Info */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-center">
            <div className="text-2xl font-light text-green-400 tracking-tight">
              {city.estimated_price}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider">from</div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <div className="text-lg font-light text-white/90">
              {Math.round(city.flight_duration * 10) / 10}h
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider">flight</div>
          </div>
        </div>

        {/* Primary Theme */}
        <div className="flex items-center justify-center mb-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm ${getThemeColorClass(city.primary_theme)}`}>
            <span className="text-lg">{getThemeIcon(city.primary_theme)}</span>
            <span className="text-sm font-medium capitalize tracking-wide">
              {city.primary_theme}
            </span>
          </div>
        </div>

        {/* Secondary Theme Indicators */}
        {relevantSecondaryThemes.length > 0 && (
          <div className="flex justify-center space-x-2">
            {relevantSecondaryThemes.map((theme) => (
              <div
                key={theme.theme}
                className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/20"
                title={`${theme.theme} (${Math.round(theme.strength * 100)}%)`}
              >
                <span className="text-xs">{getThemeIcon(theme.theme)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Info Button */}
        <button
          onClick={toggleDetails}
          className="absolute bottom-3 right-3 sm:hidden w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/30 transition-all duration-300"
          aria-label="View details"
        >
          <Info size={14} />
        </button>

        {/* Mobile Details Popup */}
        {showDetails && (
          <motion.div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-xl p-4 z-20 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={toggleDetails}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
              aria-label="Close details"
            >
              ✕
            </button>
            
            <div className="text-white space-y-2 mt-6">
              <h4 className="font-semibold">{city.name}</h4>
              <p className="text-sm text-white/80">{city.description}</p>
              
              {city.highlights && (
                <div>
                  <h5 className="text-xs uppercase tracking-wider text-white/60 mb-1">Highlights</h5>
                  <ul className="text-xs space-y-1">
                    {city.highlights.map((highlight, index) => (
                      <li key={index} className="text-white/80">• {highlight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {city.bestMonths && (
                <div>
                  <h5 className="text-xs uppercase tracking-wider text-white/60 mb-1">Best Time</h5>
                  <p className="text-xs text-white/80">{city.bestMonths.join(', ')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}