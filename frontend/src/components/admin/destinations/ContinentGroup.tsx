'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { CountryGroup } from './CountryGroup'
import type { ContinentConfig } from '@/lib/constants/continents'

interface Destination {
  id: string
  cityName: string
  airportCode: string | null
  country: {
    id: string
    name: string
    code: string
    createdAt: string
    updatedAt: string
  } | null
  airports: Array<{
    isPrimary: boolean
    createdAt: string
    airport: {
      iataCode: string
      name: string
    }
  }>
  _count: {
    themePOIs: number
  }
}

interface GroupedDestinations {
  [countryName: string]: Destination[]
}

interface ContinentGroupProps {
  continent: ContinentConfig
  groupedDestinations: GroupedDestinations
  onManageDestination: (destinationId: string) => void
  defaultExpanded?: boolean
}

export function ContinentGroup({
  continent,
  groupedDestinations,
  onManageDestination,
  defaultExpanded = true
}: ContinentGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Calculate statistics
  const countryCount = Object.keys(groupedDestinations).length
  const totalDestinations = Object.values(groupedDestinations).reduce(
    (sum, destinations) => sum + destinations.length,
    0
  )
  const totalPOIs = Object.values(groupedDestinations).reduce(
    (sum, destinations) => sum + destinations.reduce((s, d) => s + d._count.themePOIs, 0),
    0
  )

  return (
    <div className="border-2 border-white/20 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl">
      {/* Continent Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="w-6 h-6 text-white/70" />
          ) : (
            <ChevronRight className="w-6 h-6 text-white/70" />
          )}

          {/* Continent Icon & Name */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl"
              style={{ backgroundColor: `${continent.color}20`, borderColor: continent.color }}
            >
              {continent.emoji}
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-white">{continent.name}</h2>
              <p className="text-sm text-white/60">
                {countryCount} {countryCount !== 1 ? 'countries' : 'country'} • {totalDestinations} destination{totalDestinations !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Badges */}
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-white/10 rounded-full text-sm text-white/70">
            <span className="font-semibold text-white">{totalPOIs}</span> POI{totalPOIs !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {/* Countries List */}
      {isExpanded && (
        <div className="border-t-2 border-white/20 p-4 space-y-4 bg-black/20">
          {Object.entries(groupedDestinations).map(([countryName, destinations]) => (
            <CountryGroup
              key={countryName}
              countryName={countryName}
              destinations={destinations}
              onManageDestination={onManageDestination}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
