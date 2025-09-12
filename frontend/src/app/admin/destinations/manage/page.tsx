'use client'

import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  MoreHorizontal,
  Flag,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Plane,
  Camera,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Download,
  Upload
} from 'lucide-react'
import { AdminDestination } from '@/types/admin'
import adminService from '@/services/adminService'
import { DestinationControls } from '@/components/admin/DestinationControls'
import { BulkDestinationActions } from '@/components/admin/BulkDestinationActions'
import { DestinationAnalytics } from '@/components/admin/DestinationAnalytics'
import { SearchFilterControls } from '@/components/admin/SearchFilterControls'

interface DestinationStats {
  totalDestinations: number
  activeDestinations: number
  pendingApproval: number
  topPerforming: number
  totalBookings: number
  totalRevenue: number
}

export default function DestinationManagement() {
  const [destinations, setDestinations] = useState<AdminDestination[]>([])
  const [stats, setStats] = useState<DestinationStats | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<AdminDestination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDestinationModal, setShowDestinationModal] = useState(false)
  const [editingDestination, setEditingDestination] = useState<AdminDestination | null>(null)
  
  // New state for enhanced functionality
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'manage' | 'analytics'>('manage')
  const [showFilters, setShowFilters] = useState(false)
  const [searchFilters, setSearchFilters] = useState<any>({})
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getDestinations({ limit: 60 })
        const items = res.items || []
        setDestinations(items as unknown as AdminDestination[])

        const totalBookings = items.reduce((s: number, d: any) => s + (d.metrics?.totalBookings || 0), 0)
        const totalRevenue = items.reduce((s: number, d: any) => s + (d.metrics?.totalRevenue || 0), 0)
        const activeCount = items.filter((d: any) => d.isActive).length
        const topPerforming = items.filter((d: any) => (d.metrics?.popularityScore || 0) >= 8.5).length

        setStats({
          totalDestinations: res.total,
          activeDestinations: activeCount,
          pendingApproval: 0,
          topPerforming,
          totalBookings,
          totalRevenue
        })
      } catch (e) {
        console.error('Failed to load destinations', e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const getThemeColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600 bg-green-100'
    if (score >= 7.0) return 'text-yellow-600 bg-yellow-100'
    if (score >= 5.5) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
  }

  const handleUpdateDestination = async (destination: AdminDestination, updates: Partial<AdminDestination>) => {
    try {
      console.log('Updating destination:', { destination: destination.iataCode, updates })
      
      const ok = await adminService.updateDestination(destination.iataCode, updates)
      if (ok) {
        setDestinations(prev => prev.map(d => 
          d.iataCode === destination.iataCode 
            ? { ...d, ...updates, lastUpdated: new Date().toISOString() }
            : d
        ))
        alert('Destination updated successfully')
      } else {
        alert('Update failed')
      }
    } catch (error) {
      console.error('Failed to update destination:', error)
      alert('Failed to update destination')
    }
  }

  // New bulk operations handler
  const handleBulkAction = async (action: string, destinationIds: string[]) => {
    try {
      const updates: Partial<AdminDestination> = {}
      
      switch (action) {
        case 'activate':
          updates.isActive = true
          break
        case 'deactivate':
          updates.isActive = false
          break
        case 'mark_popular':
          updates.isPopular = true
          break
        case 'unmark_popular':
          updates.isPopular = false
          break
        case 'show':
          updates.isVisible = true
          break
        case 'hide':
          updates.isVisible = false
          break
        case 'delete':
          // Handle deletion logic
          break
      }

      // Apply updates to selected destinations
      for (const id of destinationIds) {
        await adminService.updateDestination(id, updates)
      }

      // Update local state
      setDestinations(prev => prev.map(d => 
        destinationIds.includes(d.iataCode) 
          ? { ...d, ...updates, lastUpdated: new Date().toISOString() }
          : d
      ))

      alert(`Successfully updated ${destinationIds.length} destinations`)
    } catch (error) {
      console.error('Bulk action failed:', error)
      alert('Bulk action failed')
    }
  }

  // Export functionality
  const handleExport = (destinationsToExport: AdminDestination[]) => {
    const csvContent = [
      ['IATA Code', 'City', 'Country', 'Active', 'Popular', 'Score', 'Bookings', 'Revenue'].join(','),
      ...destinationsToExport.map(d => [
        d.iataCode,
        d.cityName,
        d.countryName,
        d.isActive,
        d.isPopular,
        d.metrics.popularityScore,
        d.metrics.totalBookings,
        d.metrics.totalRevenue
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `destinations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Import functionality
  const handleImport = async (file: File) => {
    // Implement CSV import logic
    console.log('Importing file:', file.name)
    // This would parse the CSV and update destinations
  }

  const filteredDestinations = destinations.filter(dest => {
    if (searchQuery && !dest.cityName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !dest.countryName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterCountry !== 'all' && dest.countryName !== filterCountry) return false
    if (filterStatus === 'active' && !dest.isActive) return false
    if (filterStatus === 'inactive' && dest.isActive) return false
    return true
  }).sort((a, b) => b.metrics.popularityScore - a.metrics.popularityScore)

  const uniqueCountries = Array.from(new Set(destinations.map(d => d.countryName))).sort()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destination Management</h1>
          <p className="text-gray-600">Manage cities, themes, and travel destinations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Filter size={16} className="mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} className="mr-2" />
            Add Destination
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'manage', label: 'Manage', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent size={16} className="mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Search Filters */}
      {showFilters && (
        <SearchFilterControls
          onFiltersChange={setSearchFilters}
          initialFilters={searchFilters}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +12%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats!.totalDestinations}
            </div>
            <p className="text-sm text-gray-600">Total Destinations</p>
            <p className="text-xs text-gray-500 mt-1">{stats!.activeDestinations} active</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plane size={20} className="text-green-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +8.5%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats!.totalBookings.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-xs text-gray-500 mt-1">across all destinations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div className="text-sm text-purple-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +15.3%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats!.totalRevenue)}
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">from destination bookings</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star size={20} className="text-yellow-600" />
            </div>
            <div className="text-sm text-yellow-600 flex items-center">
              <Star size={14} className="mr-1" />
              Top rated
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats!.topPerforming}
            </div>
            <p className="text-sm text-gray-600">Top Performers</p>
            <p className="text-xs text-gray-500 mt-1">rating ≥ 8.5</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'manage' && (
        <>
          {/* Bulk Actions */}
          <BulkDestinationActions
            destinations={destinations}
            selectedDestinations={selectedDestinations}
            onSelectionChange={setSelectedDestinations}
            onBulkAction={handleBulkAction}
            onExport={handleExport}
            onImport={handleImport}
          />

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Destinations</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{filteredDestinations.length} of {destinations.length}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {/* Country Filter */}
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Countries</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Destination Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDestinations.map((destination) => (
                  <div
                    key={destination.iataCode}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Selection Checkbox */}
                    <div className="flex items-center justify-between mb-4">
                      <input
                        type="checkbox"
                        checked={selectedDestinations.includes(destination.iataCode)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDestinations([...selectedDestinations, destination.iataCode])
                          } else {
                            setSelectedDestinations(selectedDestinations.filter(id => id !== destination.iataCode))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          setSelectedDestination(destination)
                          setShowDestinationModal(true)
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {destination.iataCode}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{destination.cityName}</h3>
                      <p className="text-sm text-gray-600">{destination.countryName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(destination.isActive)}`}>
                      {destination.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {destination.isPopular && (
                      <Star size={14} className="text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">{destination.metrics.totalBookings.toLocaleString()}</div>
                    <div className="text-gray-600">Bookings</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{formatCurrency(destination.metrics.totalRevenue)}</div>
                    <div className="text-gray-600">Revenue</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{destination.metrics.popularityScore.toFixed(1)}</div>
                    <div className="text-gray-600">Popularity</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{destination.metrics.contentCount}</div>
                    <div className="text-gray-600">Content</div>
                  </div>
                </div>

                    {/* Highlights */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Highlights</div>
                      <div className="flex flex-wrap gap-2">
                        {destination.highlights.slice(0, 3).map((highlight, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Controls */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <DestinationControls
                        destination={destination}
                        onUpdate={handleUpdateDestination}
                        showAdvanced={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <DestinationAnalytics
          destinations={destinations}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}


      {/* Destination Detail Modal */}
      {showDestinationModal && selectedDestination && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {selectedDestination.iataCode}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedDestination.cityName}, {selectedDestination.countryName}</h3>
                    <p className="text-gray-600">Popularity Score: {selectedDestination.metrics.popularityScore.toFixed(1)}/10</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDestinationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Enhanced Destination Controls */}
              <DestinationControls
                destination={selectedDestination}
                onUpdate={handleUpdateDestination}
                showAdvanced={true}
              />

              {/* Performance Metrics */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedDestination.metrics.totalBookings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedDestination.metrics.totalRevenue)}</div>
                    <div className="text-sm text-gray-600">Revenue Generated</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{selectedDestination.metrics.averageStay.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Average Stay (days)</div>
                  </div>
                </div>
              </div>

              {/* Theme Scores */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Theme Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedDestination.themeScores).map(([theme, score]) => (
                    <div key={theme} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">{theme}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getThemeColor(score)}`}>
                          {score.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${(score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Activities */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Supported Activities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDestination.supportedActivities.map(activity => (
                    <span key={activity} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content Stats */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Content & Creators</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-gray-900">{selectedDestination.metrics.contentCount}</div>
                        <div className="text-sm text-gray-600">Total Content</div>
                      </div>
                      <Camera size={24} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-gray-900">{selectedDestination.metrics.creatorCount}</div>
                        <div className="text-sm text-gray-600">Active Creators</div>
                      </div>
                      <Users size={24} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}