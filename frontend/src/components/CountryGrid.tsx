'use client'

import React from 'react'
import { CountryGroup } from '@/types/country'
import { CountryCard } from './CountryCard'

interface CountryGridProps {
  countries: CountryGroup[]
  theme: string
  onExplore: (countryCode: string) => void
  isLoading?: boolean
}

export function CountryGrid({ countries, theme, onExplore, isLoading = false }: CountryGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CountryCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (countries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🌍</div>
          <h3 className="text-2xl font-bold text-white mb-3">
            No countries found
          </h3>
          <p className="text-white/70 mb-6">
            Try adjusting your search filters or flight time range to see more destinations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
      {countries.map((country) => (
        <CountryCard
          key={country.countryCode}
          country={country}
          theme={theme}
          onExplore={onExplore}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton loading state for country card
 */
function CountryCardSkeleton() {
  return (
    <div
      className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden
                 border border-white/20 animate-pulse"
    >
      {/* Image skeleton */}
      <div className="w-full aspect-[16/10] bg-white/5" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="h-7 w-3/4 bg-white/10 rounded-lg" />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 bg-white/5 rounded-lg" />
          <div className="h-14 bg-white/5 rounded-lg" />
        </div>

        {/* Destination count */}
        <div className="h-4 w-1/2 bg-white/10 rounded" />
      </div>

      {/* Button skeleton */}
      <div className="p-4 bg-[rgba(11,15,18,0.6)] border-t border-white/10">
        <div className="h-12 w-full bg-white/10 rounded-xl" />
      </div>
    </div>
  )
}
