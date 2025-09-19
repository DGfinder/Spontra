'use client'

import { useEffect, useState } from 'react'
import { Search, Plane, ToggleLeft, ToggleRight, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface AirportDetails {
  iata_code: string
  icao_code?: string
  name: string
  city: string
  country: string
  country_code?: string
  latitude?: number
  longitude?: number
  timezone?: string
  is_active: boolean
  has_flight_data: boolean
  flight_count: number
  created_at: string
  updated_at: string
}

interface AirportStats {
  total_airports: number
  active_airports: number
  inactive_airports: number
  airports_with_flights: number
  airports_without_flights: number
}

export default function ManageAirportsPage() {
  const [airports, setAirports] = useState<AirportDetails[]>([])
  const [stats, setStats] = useState<AirportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'city' | 'name' | 'country' | 'flight_count'>('city')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 50

  // Fetch airport statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/airports/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch airport stats:', error)
    }
  }

  // Fetch airports with pagination and filtering
  const fetchAirports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        filter: filterActive,
        sort: sortBy,
        order: sortDir
      })

      const response = await fetch(`/api/admin/airports/list?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAirports(data.data.airports)
        setTotalPages(Math.ceil(data.data.total / pageSize))
      }
    } catch (error) {
      console.error('Failed to fetch airports:', error)
      setAirports([])
    } finally {
      setLoading(false)
    }
  }

  // Toggle airport active status
  const toggleAirportStatus = async (iataCode: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/airports/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          iata_code: iataCode, 
          is_active: !currentStatus 
        })
      })

      if (response.ok) {
        // Refresh the current page
        await fetchAirports()
        await fetchStats()
      } else {
        alert('Failed to update airport status')
      }
    } catch (error) {
      console.error('Failed to toggle airport status:', error)
      alert('Failed to update airport status')
    }
  }

  // Sync airport activation with flight data
  const syncWithFlightData = async () => {
    if (!confirm('This will activate airports that have flight duration data and deactivate those that don\'t. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/airports/sync-with-flights', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Sync completed: ${data.data.activated} airports activated, ${data.data.deactivated} deactivated`)
        await fetchAirports()
        await fetchStats()
      } else {
        alert('Failed to sync airports with flight data')
      }
    } catch (error) {
      console.error('Failed to sync airports:', error)
      alert('Failed to sync airports with flight data')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAirports()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filterActive, sortBy, sortDir, page])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Airport Management</h1>
          <p className="text-gray-600">Manage airport activation and flight data integration</p>
        </div>
        <button
          onClick={syncWithFlightData}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          <span>Sync with Flight Data</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total_airports.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Airports</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active_airports.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active Airports</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-400">{stats.inactive_airports.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Inactive Airports</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.airports_with_flights.toLocaleString()}</div>
            <div className="text-sm text-gray-600">With Flight Data</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-orange-500">{stats.airports_without_flights.toLocaleString()}</div>
            <div className="text-sm text-gray-600">No Flight Data</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, city, name, or country..."
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Filter by Status */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Airports</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="city">Sort by City</option>
            <option value="name">Sort by Name</option>
            <option value="country">Sort by Country</option>
            <option value="flight_count">Sort by Flight Count</option>
          </select>

          <button
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            className="border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading airports...</div>
          ) : airports.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No airports found</div>
          ) : (
            <>
              {airports.map((airport) => (
                <div
                  key={airport.iata_code}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {/* Airport Code */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{airport.iata_code}</span>
                    </div>

                    {/* Airport Details */}
                    <div>
                      <div className="font-semibold text-gray-900">{airport.name}</div>
                      <div className="text-sm text-gray-600">
                        {airport.city}, {airport.country}
                        {airport.icao_code && (
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                            {airport.icao_code}
                          </span>
                        )}
                      </div>
                      {airport.flight_count > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {airport.flight_count} flight routes
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Flight Data Status */}
                    {airport.has_flight_data ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1" />
                        <span className="text-sm">Has Flights</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <XCircle size={16} className="mr-1" />
                        <span className="text-sm">No Flights</span>
                      </div>
                    )}

                    {/* Active Toggle */}
                    <button
                      onClick={() => toggleAirportStatus(airport.iata_code, airport.is_active)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                        airport.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {airport.is_active ? (
                        <>
                          <ToggleRight size={16} />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, airports.length)} of {airports.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1 || loading}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || loading}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
