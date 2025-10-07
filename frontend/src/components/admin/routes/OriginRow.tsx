'use client'

import React from 'react'
import { ChevronDown, ChevronRight, Plane } from 'lucide-react'
import { RouteDataQualityBadge } from './RouteDataQualityBadge'

interface OriginAirport {
  airportCode: string
  city: string
  country: string
  routeCount: number
}

interface FlightRoute {
  id: string
  originAirportCode: string
  destinationAirportCode: string
  totalDurationMinutes: number
  destinationCity: string
  destinationCountry: string
  isDirect: boolean | null
  isEstimated: boolean
  dataSource: string | null
  lastUpdated: string | null
}

interface OriginRowProps {
  origin: OriginAirport
  isExpanded: boolean
  routesForOrigin: FlightRoute[]
  loadingRoutes: boolean
  onToggle: () => void
  onAddRoute: () => void
  onEditRoute: (route: FlightRoute) => void
  onDeleteRoute: (id: string) => void
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function OriginRow({
  origin,
  isExpanded,
  routesForOrigin,
  loadingRoutes,
  onToggle,
  onAddRoute,
  onEditRoute,
  onDeleteRoute
}: OriginRowProps) {
  return (
    <>
      {/* Main Origin Row */}
      <div
        onClick={onToggle}
        className="group flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
      >
        {/* Left Section - Airport Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white/70" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/70" />
            )}
            <Plane className="w-4 h-4 text-white/40 shrink-0" />
            <span className="text-white font-medium">{origin.airportCode}</span>
          </div>

          <div className="text-sm text-white/70">
            {origin.city}
          </div>
        </div>

        {/* Right Section - Route Count */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm text-white/70">
            <span className="font-medium text-white">{origin.routeCount}</span> route{origin.routeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Expanded Routes Section */}
      {isExpanded && (
        <div className="bg-white/5 px-4 py-4 border-t border-white/10">
          {loadingRoutes ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-white"></div>
            </div>
          ) : routesForOrigin.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              No routes from this airport yet
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-sm text-white/70">{routesForOrigin.length} destinations</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddRoute()
                  }}
                  className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Destination
                </button>
              </div>

              {/* Nested Routes Table */}
              <table className="min-w-full">
                <thead>
                  <tr className="text-xs text-white/50 uppercase">
                    <th className="text-left pb-2">Destination</th>
                    <th className="text-left pb-2">Airport Code</th>
                    <th className="text-left pb-2">Flight Type</th>
                    <th className="text-left pb-2">Flight Duration</th>
                    <th className="text-left pb-2">Data Quality</th>
                    <th className="text-right pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {routesForOrigin.map((route) => (
                    <tr key={route.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 text-sm text-white">
                        {route.destinationCity}, {route.destinationCountry}
                      </td>
                      <td className="py-3 text-sm text-white/70">
                        {route.destinationAirportCode}
                      </td>
                      <td className="py-3 text-sm">
                        {route.isDirect === null ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-300">
                            ❓ Unknown
                          </span>
                        ) : route.isDirect ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300">
                            ✈️ Direct
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-300">
                            🔄 Connections
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-sm text-white/70">
                        <div className="flex items-center gap-2">
                          {formatDuration(route.totalDurationMinutes)}
                          {route.isEstimated && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300">
                              📊 Est.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        <RouteDataQualityBadge
                          isEstimated={route.isEstimated}
                          isDirect={route.isDirect}
                        />
                      </td>
                      <td className="py-3 text-right text-sm space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditRoute(route)
                          }}
                          className="text-blue-300 hover:text-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteRoute(route.id)
                          }}
                          className="text-red-300 hover:text-red-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}
