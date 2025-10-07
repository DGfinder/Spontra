'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getOriginAirports, getRoutesByOrigin, createFlightRoute, updateFlightRoute, deleteFlightRoute, getSearchableAirports, getRouteStatistics } from '@/actions/flightRouteActions'
import { RouteStats } from '@/components/admin/routes/RouteStats'
import { RouteFilters, type RouteFilterState } from '@/components/admin/routes/RouteFilters'
import { OriginContinentGroup } from '@/components/admin/routes/OriginContinentGroup'
import { getContinentName, CONTINENTS } from '@/lib/constants/continents'

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

interface GroupedOrigins {
  [countryName: string]: OriginAirport[]
}

interface RouteStatistics {
  totalRoutes: number
  directRoutes: number
  connectionRoutes: number
  unknownRoutes: number
  estimatedRoutes: number
}

export default function RoutesPage() {
  const [origins, setOrigins] = useState<OriginAirport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOriginCode, setExpandedOriginCode] = useState<string | null>(null)
  const [routesForOrigin, setRoutesForOrigin] = useState<FlightRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [routeStats, setRouteStats] = useState<RouteStatistics>({
    totalRoutes: 0,
    directRoutes: 0,
    connectionRoutes: 0,
    unknownRoutes: 0,
    estimatedRoutes: 0
  })

  // Filters
  const [filters, setFilters] = useState<RouteFilterState>({
    searchQuery: '',
    routeType: 'all',
    dataSource: 'all',
    sortBy: 'country'
  })

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
    loadRouteStatistics()
  }, [])

  async function loadOrigins() {
    setIsLoading(true)
    const result = await getOriginAirports()
    if (result.success && result.data) {
      setOrigins(result.data)
    }
    setIsLoading(false)
  }

  async function loadRouteStatistics() {
    const result = await getRouteStatistics()
    if (result.success && result.data) {
      setRouteStats(result.data)
    }
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
      await loadRouteStatistics()
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
      await loadRouteStatistics()
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

  // Filter and sort origins
  const filteredAndSortedOrigins = useMemo(() => {
    let filtered = origins

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (o) =>
          o.airportCode.toLowerCase().includes(query) ||
          o.city.toLowerCase().includes(query) ||
          o.country.toLowerCase().includes(query)
      )
    }

    // Note: Route type and data source filters would require fetching all routes,
    // which is too expensive. These filters are kept for UI consistency but
    // would need optimization (e.g., database-level filtering) for production.

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'code-asc':
          return a.airportCode.localeCompare(b.airportCode)
        case 'code-desc':
          return b.airportCode.localeCompare(a.airportCode)
        case 'country':
          return a.country.localeCompare(b.country)
        case 'routes-high':
          return b.routeCount - a.routeCount
        case 'routes-low':
          return a.routeCount - b.routeCount
        default:
          return 0
      }
    })

    return sorted
  }, [origins, filters])

  // Group origins by continent, then by country
  const groupedByContinent = useMemo(() => {
    // First group by country
    const byCountry: GroupedOrigins = {}
    filteredAndSortedOrigins.forEach((origin) => {
      const countryName = origin.country || 'Unknown Country'
      if (!byCountry[countryName]) {
        byCountry[countryName] = []
      }
      byCountry[countryName].push(origin)
    })

    // Then group countries by continent
    const byContinent: { [continentName: string]: GroupedOrigins } = {}
    Object.entries(byCountry).forEach(([countryName, origins]) => {
      const continentName = getContinentName(countryName)
      if (!byContinent[continentName]) {
        byContinent[continentName] = {}
      }
      byContinent[continentName][countryName] = origins
    })

    // Sort continents by predefined order, then sort countries within each continent
    const continentOrder = [...CONTINENTS.map(c => c.name), 'Other']
    const sorted = continentOrder
      .filter(continentName => byContinent[continentName]) // Only include continents that have data
      .reduce((acc, continentName) => {
        const countries = byContinent[continentName]
        // Sort countries alphabetically within each continent
        const sortedCountries = Object.keys(countries)
          .sort()
          .reduce((countryAcc, countryName) => {
            countryAcc[countryName] = countries[countryName]
            return countryAcc
          }, {} as GroupedOrigins)

        acc[continentName] = sortedCountries
        return acc
      }, {} as { [continentName: string]: GroupedOrigins })

    return sorted
  }, [filteredAndSortedOrigins])

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

      {/* Statistics Dashboard */}
      <RouteStats
        origins={origins}
        totalRoutes={routeStats.totalRoutes}
        directRoutes={routeStats.directRoutes}
        connectionRoutes={routeStats.connectionRoutes}
        unknownRoutes={routeStats.unknownRoutes}
        estimatedRoutes={routeStats.estimatedRoutes}
      />

      {/* Filters */}
      <RouteFilters filters={filters} onFilterChange={setFilters} />

      {/* Grouped Origins by Continent */}
      {Object.keys(groupedByContinent).length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/60">No origin airports found matching your filters</p>
          <button
            onClick={() =>
              setFilters({ searchQuery: '', routeType: 'all', dataSource: 'all', sortBy: 'country' })
            }
            className="mt-4 text-blue-300 hover:text-blue-200 text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByContinent).map(([continentName, countryGroups]) => {
            const continentConfig = CONTINENTS.find(c => c.name === continentName) || {
              name: continentName,
              emoji: '🌐',
              color: '#6b7280',
              countries: []
            }

            return (
              <OriginContinentGroup
                key={continentName}
                continent={continentConfig}
                groupedOrigins={countryGroups}
                onToggleOrigin={toggleOriginExpansion}
                expandedOriginCode={expandedOriginCode}
                routesForOrigin={routesForOrigin}
                loadingRoutes={loadingRoutes}
                onAddRoute={openAddForm}
                onEditRoute={openEditForm}
                onDeleteRoute={handleDelete}
              />
            )
          })}
        </div>
      )}

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
