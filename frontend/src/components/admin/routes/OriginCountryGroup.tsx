'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Globe } from 'lucide-react'
import { OriginRow } from './OriginRow'

interface OriginAirport {
  airportCode: string
  city: string
  country: string
  routeCount: number
}

interface OriginCountryGroupProps {
  countryName: string
  origins: OriginAirport[]
  onToggleOrigin: (airportCode: string) => void
  expandedOriginCode: string | null
  routesForOrigin: any[]
  loadingRoutes: boolean
  onAddRoute: (originCode: string) => void
  onEditRoute: (route: any) => void
  onDeleteRoute: (id: string) => void
  defaultExpanded?: boolean
}

export function OriginCountryGroup({
  countryName,
  origins,
  onToggleOrigin,
  expandedOriginCode,
  routesForOrigin,
  loadingRoutes,
  onAddRoute,
  onEditRoute,
  onDeleteRoute,
  defaultExpanded = false
}: OriginCountryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const totalRoutes = origins.reduce((sum, o) => sum + o.routeCount, 0)
  const originCount = origins.length

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
                {originCount} airport{originCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Total Routes Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white/70">
            <span className="font-medium text-white">{totalRoutes.toLocaleString()}</span> route{totalRoutes !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {/* Origins List */}
      {isExpanded && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {origins.map((origin) => (
            <OriginRow
              key={origin.airportCode}
              origin={origin}
              isExpanded={expandedOriginCode === origin.airportCode}
              routesForOrigin={routesForOrigin}
              loadingRoutes={loadingRoutes}
              onToggle={() => onToggleOrigin(origin.airportCode)}
              onAddRoute={() => onAddRoute(origin.airportCode)}
              onEditRoute={onEditRoute}
              onDeleteRoute={onDeleteRoute}
            />
          ))}
        </div>
      )}
    </div>
  )
}
