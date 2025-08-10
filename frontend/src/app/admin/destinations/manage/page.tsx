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
  AlertTriangle
} from 'lucide-react'
import { AdminDestination } from '@/types/admin'

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

  // Mock data
  const mockStats: DestinationStats = {
    totalDestinations: 47,
    activeDestinations: 42,
    pendingApproval: 3,
    topPerforming: 12,
    totalBookings: 15623,
    totalRevenue: 1245670
  }

  const mockDestinations: AdminDestination[] = [
    {
      iataCode: 'BCN',
      cityName: 'Barcelona',
      countryName: 'Spain',
      countryCode: 'ES',
      continent: 'Europe',
      coordinates: { lat: 41.3851, lng: 2.1734 },
      isActive: true,
      isPopular: true,
      highlights: ['Gothic Quarter', 'Park Güell', 'Sagrada Família', 'Las Ramblas'],
      themeScores: {
        nightlife: 9.2,
        culture: 8.7,
        adventure: 6.5,
        relaxation: 7.3,
        food: 8.9,
        shopping: 7.8,
        nature: 5.2,
        romance: 8.1
      },
      supportedActivities: ['nightlife', 'culture', 'food', 'shopping', 'romance'],
      metrics: {
        totalBookings: 3456,
        totalRevenue: 287500,
        averageStay: 3.2,
        popularityScore: 9.1,
        contentCount: 234,
        creatorCount: 67
      },
      description: 'Vibrant Mediterranean city known for art, architecture, and nightlife',
      imageUrl: '/images/destinations/barcelona.jpg',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    {
      iataCode: 'AMS',
      cityName: 'Amsterdam',
      countryName: 'Netherlands',
      countryCode: 'NL',
      continent: 'Europe',
      coordinates: { lat: 52.3676, lng: 4.9041 },
      isActive: true,
      isPopular: true,
      highlights: ['Anne Frank House', 'Van Gogh Museum', 'Canal District', 'Jordaan District'],
      themeScores: {
        nightlife: 8.1,
        culture: 9.0,
        adventure: 5.8,
        relaxation: 7.8,
        food: 7.5,
        shopping: 8.2,
        nature: 6.7,
        romance: 8.3
      },
      supportedActivities: ['culture', 'nightlife', 'shopping', 'romance'],
      metrics: {
        totalBookings: 2890,
        totalRevenue: 234500,
        averageStay: 2.8,
        popularityScore: 8.7,
        contentCount: 189,
        creatorCount: 45
      },
      description: 'Canal-lined city known for museums, cycling culture, and liberal atmosphere',
      imageUrl: '/images/destinations/amsterdam.jpg',
      lastUpdated: '2024-01-14T15:30:00Z'
    },
    {
      iataCode: 'ROM',
      cityName: 'Rome',
      countryName: 'Italy',
      countryCode: 'IT',
      continent: 'Europe',
      coordinates: { lat: 41.9028, lng: 12.4964 },
      isActive: true,
      isPopular: true,
      highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum'],
      themeScores: {
        nightlife: 7.5,
        culture: 9.8,
        adventure: 6.2,
        relaxation: 6.9,
        food: 9.4,
        shopping: 7.1,
        nature: 4.8,
        romance: 9.2
      },
      supportedActivities: ['culture', 'food', 'romance'],
      metrics: {
        totalBookings: 2345,
        totalRevenue: 198750,
        averageStay: 3.5,
        popularityScore: 8.9,
        contentCount: 156,
        creatorCount: 38
      },
      description: 'Eternal City with ancient history, incredible cuisine, and romantic atmosphere',
      imageUrl: '/images/destinations/rome.jpg',
      lastUpdated: '2024-01-13T09:15:00Z'
    },
    {
      iataCode: 'PRG',
      cityName: 'Prague',
      countryName: 'Czech Republic',
      countryCode: 'CZ',
      continent: 'Europe',
      coordinates: { lat: 50.0755, lng: 14.4378 },
      isActive: false,
      isPopular: false,
      highlights: ['Prague Castle', 'Charles Bridge', 'Old Town Square', 'Wenceslas Square'],
      themeScores: {
        nightlife: 8.3,
        culture: 8.6,
        adventure: 5.5,
        relaxation: 7.2,
        food: 7.8,
        shopping: 6.9,
        nature: 6.1,
        romance: 8.7
      },
      supportedActivities: ['nightlife', 'culture', 'romance'],
      metrics: {
        totalBookings: 1234,
        totalRevenue: 98750,
        averageStay: 2.9,
        popularityScore: 7.8,
        contentCount: 78,
        creatorCount: 23
      },
      description: 'Fairy-tale city with Gothic architecture, rich history, and vibrant beer culture',
      imageUrl: '/images/destinations/prague.jpg',
      lastUpdated: '2024-01-10T12:00:00Z'
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setStats(mockStats)
      setDestinations(mockDestinations)
      setIsLoading(false)
    }, 1000)
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
      
      setDestinations(prev => prev.map(d => 
        d.iataCode === destination.iataCode 
          ? { ...d, ...updates, lastUpdated: new Date().toISOString() }
          : d
      ))
      
      alert('Destination updated successfully')
    } catch (error) {
      console.error('Failed to update destination:', error)
      alert('Failed to update destination')
    }
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
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} className="mr-2" />
            Add Destination
          </button>
        </div>
      </div>

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
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedDestination(destination)
                  setShowDestinationModal(true)
                }}
              >
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

                {/* Top Themes */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Top Themes</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(destination.themeScores)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([theme, score]) => (
                        <span
                          key={theme}
                          className={`px-2 py-1 rounded text-xs font-medium ${getThemeColor(score)}`}
                        >
                          {theme} ({score.toFixed(1)})
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                    <h3 className="text-xl font-semibold text-gray-900">{selectedDestination.city}, {selectedDestination.country}</h3>
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
              {/* Status Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleUpdateDestination(selectedDestination, { isActive: !selectedDestination.isActive })}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                    selectedDestination.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {selectedDestination.isActive ? <XCircle size={16} className="mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                  {selectedDestination.isActive ? 'Deactivate' : 'Activate'}
                </button>
                
                <button
                  onClick={() => handleUpdateDestination(selectedDestination, { isPopular: !selectedDestination.isPopular })}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                    selectedDestination.isPopular
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star size={16} className="mr-2" />
                  {selectedDestination.isPopular ? 'Remove from Popular' : 'Mark as Popular'}
                </button>
              </div>

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