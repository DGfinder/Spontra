'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { OriginCountryGroup } from './OriginCountryGroup'
import type { ContinentConfig } from '@/lib/constants/continents'

interface OriginAirport {
  airportCode: string
  city: string
  country: string
  routeCount: number
}

interface GroupedOrigins {
  [countryName: string]: OriginAirport[]
}

interface OriginContinentGroupProps {
  continent: ContinentConfig
  groupedOrigins: GroupedOrigins
  onToggleOrigin: (airportCode: string) => void
  expandedOriginCode: string | null
  routesForOrigin: any[]
  loadingRoutes: boolean
  onAddRoute: (originCode: string) => void
  onEditRoute: (route: any) => void
  onDeleteRoute: (id: string) => void
  defaultExpanded?: boolean
}

export function OriginContinentGroup({
  continent,
  groupedOrigins,
  onToggleOrigin,
  expandedOriginCode,
  routesForOrigin,
  loadingRoutes,
  onAddRoute,
  onEditRoute,
  onDeleteRoute,
  defaultExpanded = true
}: OriginContinentGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Calculate statistics
  const countryCount = Object.keys(groupedOrigins).length
  const totalOrigins = Object.values(groupedOrigins).reduce(
    (sum, origins) => sum + origins.length,
    0
  )
  const totalRoutes = Object.values(groupedOrigins).reduce(
    (sum, origins) => sum + origins.reduce((s, o) => s + o.routeCount, 0),
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
                {countryCount} {countryCount !== 1 ? 'countries' : 'country'} • {totalOrigins} origin airport{totalOrigins !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Badges */}
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-white/10 rounded-full text-sm text-white/70">
            <span className="font-semibold text-white">{totalRoutes.toLocaleString()}</span> route{totalRoutes !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {/* Countries List */}
      {isExpanded && (
        <div className="border-t-2 border-white/20 p-4 space-y-4 bg-black/20">
          {Object.entries(groupedOrigins).map(([countryName, origins]) => (
            <OriginCountryGroup
              key={countryName}
              countryName={countryName}
              origins={origins}
              onToggleOrigin={onToggleOrigin}
              expandedOriginCode={expandedOriginCode}
              routesForOrigin={routesForOrigin}
              loadingRoutes={loadingRoutes}
              onAddRoute={onAddRoute}
              onEditRoute={onEditRoute}
              onDeleteRoute={onDeleteRoute}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
