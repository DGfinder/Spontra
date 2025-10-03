'use client'

import React, { useState, useEffect } from 'react'
import { getOriginAirports, getRoutesByOrigin, createFlightRoute, updateFlightRoute, deleteFlightRoute, getSearchableAirports } from '@/actions/flightRouteActions'
import { ChevronDown, ChevronRight } from 'lucide-react'

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

interface Airport {
  iataCode: string
  city: string
  country: string
}

export default function RoutesPage() {
  const [origins, setOrigins] = useState<OriginAirport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOriginCode, setExpandedOriginCode] = useState<string | null>(null)
  const [routesForOrigin, setRoutesForOrigin] = useState<FlightRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(false)

  // Form state
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<FlightRoute | null>(null)
  const [airports, setAirports] = useState<Airport[]>([])

  const [formData, setFormData] = useState({
    originAirportCode: '',
    destinationAirportCode: '',
    totalDurationMinutes: 0
  })

  useEffect(() => {
    loadOrigins()
  }, [])

  async function loadOrigins() {
    setIsLoading(true)
    const result = await getOriginAirports()
    if (result.success && result.data) {
      setOrigins(result.data)
    }
    setIsLoading(false)
  }

  async function toggleOriginExpansion(airportCode: string) {
    if (expandedOriginCode === airportCode) {
      // Collapse
      setExpandedOriginCode(null)
      setRoutesForOrigin([])
    } else {
      // Expand
      setExpandedOriginCode(airportCode)
      setLoadingRoutes(true)
      const result = await getRoutesByOrigin(airportCode)
      if (result.success && result.data) {
        setRoutesForOrigin(result.data)
      }
      setLoadingRoutes(false)
    }
  }

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  async function openAddForm(originCode?: string) {
    // Load airports for dropdown
    const result = await getSearchableAirports()
    if (result.success && result.data) {
      setAirports(result.data)
    }

    setFormData({
      originAirportCode: originCode || '',
      destinationAirportCode: '',
      totalDurationMinutes: 0
    })
    setIsAddFormOpen(true)
  }

  function openEditForm(route: FlightRoute) {
    setEditingRoute(route)
    setFormData({
      originAirportCode: route.originAirportCode,
      destinationAirportCode: route.destinationAirportCode,
      totalDurationMinutes: route.totalDurationMinutes
    })
    setIsEditFormOpen(true)
  }

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault()

    const result = await createFlightRoute({
      originAirportCode: formData.originAirportCode.toUpperCase(),
      destinationAirportCode: formData.destinationAirportCode.toUpperCase(),
      totalDurationMinutes: formData.totalDurationMinutes
    })

    if (result.success) {
      setIsAddFormOpen(false)
      await loadOrigins()
      // Refresh expanded routes if applicable
      if (expandedOriginCode === formData.originAirportCode.toUpperCase()) {
        const routesResult = await getRoutesByOrigin(formData.originAirportCode.toUpperCase())
        if (routesResult.success && routesResult.data) {
          setRoutesForOrigin(routesResult.data)
        }
      }
    } else {
      alert(result.error)
    }
  }

  async function handleUpdateRoute(e: React.FormEvent) {
    e.preventDefault()

    if (!editingRoute) return

    const result = await updateFlightRoute(editingRoute.id, formData.totalDurationMinutes)

    if (result.success) {
      setIsEditFormOpen(false)
      setEditingRoute(null)
      // Refresh expanded routes
      if (expandedOriginCode) {
        const routesResult = await getRoutesByOrigin(expandedOriginCode)
        if (routesResult.success && routesResult.data) {
          setRoutesForOrigin(routesResult.data)
        }
      }
    } else {
      alert(result.error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this route?')) return

    const result = await deleteFlightRoute(id)
    if (result.success) {
      await loadOrigins()
      // Refresh expanded routes
      if (expandedOriginCode) {
        const routesResult = await getRoutesByOrigin(expandedOriginCode)
        if (routesResult.success && routesResult.data) {
          setRoutesForOrigin(routesResult.data)
        }
      }
    } else {
      alert(result.error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Flight Routes</h1>
          <p className="text-white/70 mt-1">Manage flight routes and durations between airports</p>
        </div>
        <button
          onClick={() => openAddForm()}
          className="bg-white text-brand-purple px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          + Add Route
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Origin Airport
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Routes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {origins.map((origin) => {
              const isExpanded = expandedOriginCode === origin.airportCode
              return (
                <React.Fragment key={origin.airportCode}>
                  {/* Main Origin Row */}
                  <tr
                    onClick={() => toggleOriginExpansion(origin.airportCode)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-white/70" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/70" />
                        )}
                        {origin.airportCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {origin.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {origin.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {origin.routeCount} routes
                    </td>
                  </tr>

                  {/* Expanded Routes Section */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} className="bg-white/5 px-6 py-4">
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
                                  openAddForm(origin.airportCode)
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
                                    <td className="py-3 text-right text-sm space-x-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openEditForm(route)
                                        }}
                                        className="text-blue-300 hover:text-blue-200"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(route.id)
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {origins.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No flight routes yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Add Route Modal */}
      {isAddFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Add Flight Route</h2>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Origin Airport Code
                </label>
                <input
                  type="text"
                  value={formData.originAirportCode}
                  onChange={(e) => setFormData({ ...formData, originAirportCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 uppercase"
                  placeholder="DXB"
                  maxLength={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Destination Airport Code
                </label>
                <input
                  type="text"
                  value={formData.destinationAirportCode}
                  onChange={(e) => setFormData({ ...formData, destinationAirportCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 uppercase"
                  placeholder="LHR"
                  maxLength={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Flight Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.totalDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, totalDurationMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="420"
                  min="0"
                  required
                />
                {formData.totalDurationMinutes > 0 && (
                  <p className="text-xs text-white/50 mt-1">
                    {formatDuration(formData.totalDurationMinutes)}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-brand-purple rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  Create Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {isEditFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Flight Duration</h2>

            <form onSubmit={handleUpdateRoute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Route
                </label>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                  {formData.originAirportCode} → {formData.destinationAirportCode}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Flight Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.totalDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, totalDurationMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="420"
                  min="0"
                  required
                />
                {formData.totalDurationMinutes > 0 && (
                  <p className="text-xs text-white/50 mt-1">
                    {formatDuration(formData.totalDurationMinutes)}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditFormOpen(false)
                    setEditingRoute(null)
                  }}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-brand-purple rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  Update Duration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
