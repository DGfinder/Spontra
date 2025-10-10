'use client'

import { MapPin } from 'lucide-react'
import { DataQualityBadge } from './DataQualityBadge'

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

interface DestinationRowProps {
  destination: Destination
  onManage: () => void
}

export function DestinationRow({ destination, onManage }: DestinationRowProps) {
  const hasAirports = destination.airports && destination.airports.length > 0
  const poiCount = destination._count.themePOIs

  return (
    <div
      onClick={onManage}
      className="group flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
    >
      {/* Left Section - City & Airports */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* City Name */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white/40 shrink-0" />
          <span className="text-white font-medium">{destination.cityName}</span>
        </div>

        {/* Airports */}
        <div className="flex flex-wrap gap-1.5">
          {hasAirports ? (
            destination.airports.map((da) => (
              <span
                key={da.airport.iataCode}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  da.isPrimary
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
                title={da.airport.name}
              >
                {da.airport.iataCode}
                {da.isPrimary && ' ★'}
              </span>
            ))
          ) : destination.airportCode ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
              {destination.airportCode}
            </span>
          ) : (
            <span className="text-xs text-white/40">No airports</span>
          )}
        </div>
      </div>

      {/* Right Section - POIs, Quality, Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* POI Count */}
        <div className="text-sm text-white/70">
          <span className="font-medium text-white">{poiCount}</span> POI{poiCount !== 1 ? 's' : ''}
        </div>

        {/* Quality Badge */}
        <DataQualityBadge hasAirports={hasAirports} poiCount={poiCount} />

        {/* Manage Button - Visual indicator (row is clickable) */}
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent double-trigger
            onManage()
          }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all opacity-60 group-hover:opacity-100"
        >
          Manage POIs
        </button>
      </div>
    </div>
  )
}
