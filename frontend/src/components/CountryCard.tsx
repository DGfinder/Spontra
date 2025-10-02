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

  const formatFlightTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const formatPrice = (price: number, currency: string) => {
    return `${currency} $${price.toFixed(0)}`
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
          // Gradient fallback with flag overlay
          <div className={`w-full h-full ${gradientClass} relative`}>
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
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          {/* Country Name with Flag Emoji */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" role="img" aria-label={`${country.countryName} flag`}>
              {getCountryFlag(country.countryCode)}
            </span>
            <h3 className="text-2xl font-bold">
              {country.countryName}
            </h3>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            {/* Flight Time */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white/60 text-xs">Flight Time</div>
                <div className="font-medium">
                  {formatFlightTime(country.shortestFlightTime)}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <DollarSign className="w-4 h-4 text-green-300" />
              </div>
              <div>
                <div className="text-white/60 text-xs">From</div>
                <div className="font-semibold text-green-300">
                  ${country.cheapestPrice.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Destination Count */}
          <div className="flex items-center gap-2 mb-4 text-white/80">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">
              {country.destinationCount} destination{country.destinationCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 bg-[rgba(11,15,18,0.6)] backdrop-blur-sm border-t border-white/10">
        <Button
          onClick={() => onExplore(country.countryCode)}
          variant="gold"
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
