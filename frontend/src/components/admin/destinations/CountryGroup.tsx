'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Globe } from 'lucide-react'
import { DestinationRow } from './DestinationRow'

interface Destination {
  id: string
  cityName: string
  airportCode: string | null
  airports: Array<{
    isPrimary: boolean
    airport: {
      iataCode: string
      name: string
    }
  }>
  _count: {
    themePOIs: number
  }
}

interface CountryGroupProps {
  countryName: string
  destinations: Destination[]
  onManageDestination: (destinationId: string) => void
  defaultExpanded?: boolean
}

export function CountryGroup({
  countryName,
  destinations,
  onManageDestination,
  defaultExpanded = true
}: CountryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const totalPOIs = destinations.reduce((sum, d) => sum + d._count.themePOIs, 0)
  const destinationCount = destinations.length

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-xl">
      {/* Country Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronRight className="w-5 h-5 text-white/60" />
          )}

          {/* Country Icon & Name */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Globe className="w-5 h-5 text-white/70" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white">{countryName}</h3>
              <p className="text-sm text-white/50">
                {destinationCount} destination{destinationCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Total POIs Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white/70">
            <span className="font-medium text-white">{totalPOIs}</span> POI{totalPOIs !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {/* Destinations List */}
      {isExpanded && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {destinations.map((destination) => (
            <DestinationRow
              key={destination.id}
              destination={destination}
              onManage={() => onManageDestination(destination.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
