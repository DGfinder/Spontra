'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Plane, DollarSign, MapPin } from 'lucide-react'
import { CountryGroup } from '@/types/country'
import { Button } from './ui/Button'

interface CountryCardProps {
  country: CountryGroup
  theme: string
  onExplore: (countryCode: string) => void
}

export function CountryCard({ country, theme, onExplore }: CountryCardProps) {
  const [imageError, setImageError] = useState(false)

  // Determine gradient class based on theme
  const gradientClass = `country-gradient-${theme}`

  // Theme colors for the top accent bar
  const themeColors: Record<string, string> = {
    adventure: 'linear-gradient(135deg, #ffbd0a 0%, #ff8c00 100%)',
    nature: 'linear-gradient(135deg, #02c06d 0%, #00875a 100%)',
    indulge: 'linear-gradient(135deg, #e52b00 0%, #b22200 100%)',
    vibe: 'linear-gradient(135deg, #eb5b25 0%, #d84315 100%)',
    discover: 'linear-gradient(135deg, #7f6ae4 0%, #5e35b1 100%)',
  }

  const themeGradient = themeColors[theme] || themeColors.vibe

  const formatFlightTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const formatPrice = (price: number, currency: string) => {
    return `${currency} $${price.toFixed(0)}`
  }

  // Get theme color for SVG
  const getThemeColor = (theme: string): string => {
    const colors: Record<string, string> = {
      adventure: '#ffbd0a',
      nature: '#02c06d',
      indulge: '#e52b00',
      vibe: '#eb5b25',
      discover: '#7f6ae4',
    }
    return colors[theme] || '#ffffff'
  }

  return (
    <article
      className="group relative bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden
                 border border-white/20 hover:border-white/30
                 transition-all duration-300 transform-gpu
                 hover:-translate-y-2 hover:shadow-2xl"
      style={{
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}
    >
      {/* Image Container - 16:10 aspect ratio */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        {country.imageType === 'gradient' || imageError ? (
          // Gradient fallback with flag overlay - using neutral gradient
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 relative">
            {/* Flag SVG overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <Image
                src={country.imageUrl || `/maps/${country.countryCode}.svg`}
                alt={`${country.countryName} flag`}
                width={200}
                height={200}
                className="w-32 h-32 object-contain"
                onError={() => {
                  // If flag SVG also fails, just show gradient
                }}
              />
            </div>
          </div>
        ) : (
          // Actual image (custom or default)
          <Image
            src={country.imageUrl || `/countries/${country.countryCode}.jpg`}
            alt={`${country.countryName} landscape`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 country-card-overlay" />

        {/* Card Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 text-white">
          {/* Country Name with Map/Flag - Semi-solid background */}
          <div className="bg-black/80 backdrop-blur-sm px-6 pt-5 pb-3">
            <div className="flex items-center gap-3 mb-2">
              {/* Country Map SVG or Flag Emoji */}
              <div className="flex-shrink-0">
                {country.mapSvg ? (
                  <div
                    className="w-8 h-8 flex items-center justify-center"
                    style={{ color: getThemeColor(theme) }}
                    dangerouslySetInnerHTML={{
                      __html: country.mapSvg
                        .replace(/fill="[^"]*"/gi, 'fill="currentColor"')
                        .replace(/stroke="[^"]*"/gi, 'stroke="currentColor"')
                        .replace(/<svg/, '<svg class="w-full h-full object-contain"')
                    }}
                  />
                ) : (
                  <span className="text-3xl leading-none" role="img" aria-label={`${country.countryName} flag`}>
                    {getCountryFlag(country.countryCode)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold leading-tight mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {country.countryName}
                </h3>
                {/* POI Highlights Subtext */}
                {country.poiHighlights && country.poiHighlights.length > 0 && (
                  <p className="text-xs text-white/70 leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                    {country.poiHighlights.slice(0, 2).join(' • ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Grid - Solid background for readability */}
          <div className="bg-gray-900/95 px-6 py-4">
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              {/* Flight Time */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                >
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white/70 text-xs" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Flight Time</div>
                  <div className="font-medium" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    {formatFlightTime(country.shortestFlightTime)}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                >
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-white/70 text-xs" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>From</div>
                  <div className="font-semibold text-green-400" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    ${country.cheapestPrice.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Count */}
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="text-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {country.destinationCount} destination{country.destinationCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 bg-gray-900/98 backdrop-blur-none border-t border-white/20">
        <Button
          onClick={() => onExplore(country.countryCode)}
          variant={theme as any}
          size="md"
          className="w-full group-hover:shadow-xl transition-all"
        >
          Explore {country.countryName}
        </Button>
      </div>
    </article>
  )
}

/**
 * Get flag emoji for country code
 * Uses Regional Indicator Symbols (🇺🇸 = U+1F1FA + U+1F1F8)
 */
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))

  return String.fromCodePoint(...codePoints)
}
