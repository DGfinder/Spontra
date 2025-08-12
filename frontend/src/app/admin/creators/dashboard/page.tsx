'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Video, 
  Star, 
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  Crown,
  Award,
  Calendar,
  MapPin,
  Play
} from 'lucide-react'
import { CreatorDashboard as CreatorData } from '@/types/admin'

interface CreatorStats {
  totalCreators: number
  activeCreators: number
  newThisMonth: number
  totalEarnings: number
  pendingPayouts: number
  averageRating: number
  topPerformers: CreatorData[]
  recentJoins: CreatorData[]
  tierDistribution: Array<{
    tier: string
    count: number
    percentage: number
    averageEarnings: number
  }>
}

export default function CreatorManagement() {
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [creators, setCreators] = useState<CreatorData[]>([])
  const [selectedCreator, setSelectedCreator] = useState<CreatorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreatorModal, setShowCreatorModal] = useState(false)

  // Mock data - in production this would come from your creator service
  const mockStats: CreatorStats = {
    totalCreators: 2847,
    activeCreators: 1923,
    newThisMonth: 145,
    totalEarnings: 245670,
    pendingPayouts: 34,
    averageRating: 4.7,
    topPerformers: [],
    recentJoins: [],
    tierDistribution: [
      { tier: 'Explorer', count: 1876, percentage: 65.9, averageEarnings: 45.30 },
      { tier: 'Contributor', count: 734, percentage: 25.8, averageEarnings: 189.50 },
      { tier: 'Ambassador', count: 198, percentage: 7.0, averageEarnings: 567.80 },
      { tier: 'Creator', count: 39, percentage: 1.4, averageEarnings: 1456.20 }
    ]
  }

  const mockCreators: CreatorData[] = [
    {
      id: '1',
      username: 'travel_enthusiast',
      email: 'mike@example.com',
      tier: 'ambassador',
      joinedAt: '2023-08-15T10:00:00Z',
      lastActive: '2024-01-15T14:30:00Z',
      metrics: {
        totalUploads: 47,
        totalViews: 125600,
        totalBookings: 234,
        totalEarnings: 3456.78,
        averageQuality: 8.9,
        engagementRate: 12.4
      },
      currentMonthMetrics: {
        uploads: 6,
        views: 15600,
        earnings: 456.78,
        bookings: 28
      },
      payoutInfo: {
        pendingAmount: 123.45,
        lastPayoutDate: '2024-01-01T00:00:00Z',
        paymentMethod: 'bank_transfer',
        taxInfo: true
      },
      status: {
        isActive: true,
        isVerified: true,
        hasWarnings: false,
        restrictionLevel: 'none'
      }
    },
    {
      id: '2',
      username: 'city_explorer',
      email: 'sarah@example.com',
      tier: 'creator',
      joinedAt: '2023-06-20T09:00:00Z',
      lastActive: '2024-01-15T16:20:00Z',
      metrics: {
        totalUploads: 89,
        totalViews: 234500,
        totalBookings: 456,
        totalEarnings: 6789.12,
        averageQuality: 9.2,
        engagementRate: 15.7
      },
      currentMonthMetrics: {
        uploads: 8,
        views: 23400,
        earnings: 789.12,
        bookings: 45
      },
      payoutInfo: {
        pendingAmount: 234.56,
        lastPayoutDate: '2024-01-01T00:00:00Z',
        paymentMethod: 'paypal',
        taxInfo: true
      },
      status: {
        isActive: true,
        isVerified: true,
        hasWarnings: false,
        restrictionLevel: 'none'
      }
    },
    {
      id: '3',
      username: 'adventure_seeker',
      email: 'alex@example.com',
      tier: 'contributor',
      joinedAt: '2023-11-10T11:30:00Z',
      lastActive: '2024-01-14T08:15:00Z',
      metrics: {
        totalUploads: 23,
        totalViews: 67800,
        totalBookings: 123,
        totalEarnings: 1567.89,
        averageQuality: 7.8,
        engagementRate: 9.3
      },
      currentMonthMetrics: {
        uploads: 3,
        views: 8900,
        earnings: 167.89,
        bookings: 15
      },
      payoutInfo: {
        pendingAmount: 67.89,
        lastPayoutDate: '2023-12-01T00:00:00Z',
        paymentMethod: 'bank_transfer',
        taxInfo: false
      },
      status: {
        isActive: true,
        isVerified: false,
        hasWarnings: true,
        restrictionLevel: 'warning'
      }
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats(mockStats)
      setCreators(mockCreators)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'creator': return <Crown size={16} className="text-purple-500" />
      case 'ambassador': return <Award size={16} className="text-blue-500" />
      case 'contributor': return <Star size={16} className="text-green-500" />
      case 'explorer': return <Users size={16} className="text-gray-500" />
      default: return <Users size={16} className="text-gray-500" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'creator': return 'text-purple-600 bg-purple-100'
      case 'ambassador': return 'text-blue-600 bg-blue-100'
      case 'contributor': return 'text-green-600 bg-green-100'
      case 'explorer': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: CreatorData['status']) => {
    if (!status.isActive) return 'text-red-600 bg-red-100'
    if (status.restrictionLevel === 'suspended') return 'text-red-600 bg-red-100'
    if (status.restrictionLevel === 'warning') return 'text-orange-600 bg-orange-100'
    if (!status.isVerified) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getStatusText = (status: CreatorData['status']) => {
    if (!status.isActive) return 'Inactive'
    if (status.restrictionLevel === 'suspended') return 'Suspended'
    if (status.restrictionLevel === 'warning') return 'Warning'
    if (!status.isVerified) return 'Unverified'
    return 'Active'
  }

  const filteredCreators = creators.filter(creator => {
    if (searchQuery && !creator.username.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterTier !== 'all' && creator.tier !== filterTier) {
      return false
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && !creator.status.isActive) return false
      if (filterStatus === 'verified' && !creator.status.isVerified) return false
      if (filterStatus === 'warning' && !creator.status.hasWarnings) return false
    }
    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
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
          <h1 className="text-2xl font-bold text-gray-900">Creator Management</h1>
          <p className="text-gray-600">Manage your creator program and track performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +12.5%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats!.totalCreators.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Creators</p>
            <p className="text-xs text-gray-500 mt-1">{stats!.activeCreators} active</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +8.9%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats!.totalEarnings)}
            </div>
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-xs text-gray-500 mt-1">{stats!.pendingPayouts} pending payouts</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck size={20} className="text-purple-600" />
            </div>
            <div className="text-sm text-purple-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +{stats!.newThisMonth}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats!.newThisMonth}
            </div>
            <p className="text-sm text-gray-600">New This Month</p>
            <p className="text-xs text-gray-500 mt-1">vs last month</p>
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
              {stats!.averageRating.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">Average Rating</p>
            <p className="text-xs text-gray-500 mt-1">creator quality score</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Creator List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Creators</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{filteredCreators.length} of {creators.length}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {/* Tier Filter */}
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Tiers</option>
                  <option value="explorer">Explorer</option>
                  <option value="contributor">Contributor</option>
                  <option value="ambassador">Ambassador</option>
                  <option value="creator">Creator</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="verified">Verified</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>

            {/* Creator Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Creator</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Tier</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Content</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Bookings</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Earnings</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreators.map((creator) => (
                    <tr key={creator.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {creator.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">@{creator.username}</div>
                            <div className="text-sm text-gray-600">{creator.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {getTierIcon(creator.tier)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(creator.tier)}`}>
                            {creator.tier.charAt(0).toUpperCase() + creator.tier.slice(1)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="text-center py-4 px-6">
                        <div className="font-semibold text-gray-900">{creator.metrics.totalUploads}</div>
                        <div className="text-xs text-gray-500">{creator.metrics.totalViews.toLocaleString()} views</div>
                      </td>
                      
                      <td className="text-center py-4 px-6">
                        <div className="font-semibold text-gray-900">{creator.metrics.totalBookings}</div>
                        <div className="text-xs text-gray-500">{creator.currentMonthMetrics.bookings} this month</div>
                      </td>
                      
                      <td className="text-center py-4 px-6">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(creator.metrics.totalEarnings)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(creator.payoutInfo.pendingAmount)} pending
                        </div>
                      </td>
                      
                      <td className="text-center py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(creator.status)}`}>
                          {getStatusText(creator.status)}
                        </span>
                      </td>
                      
                      <td className="text-center py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedCreator(creator)
                              setShowCreatorModal(true)
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                          >
                            <Eye size={14} />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Tier Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Distribution</h3>
            
            <div className="space-y-3">
              {stats!.tierDistribution.map((tier, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTierIcon(tier.tier.toLowerCase())}
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {tier.tier}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{tier.count}</div>
                    <div className="text-xs text-gray-500">{tier.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
                <div className="flex items-center">
                  <DollarSign size={16} className="text-green-600 mr-3" />
                  <span className="text-sm font-medium">Process Payouts</span>
                </div>
                <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                  {stats!.pendingPayouts}
                </span>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="flex items-center">
                  <UserCheck size={16} className="text-blue-600 mr-3" />
                  <span className="text-sm font-medium">Review Applications</span>
                </div>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                <div className="flex items-center">
                  <Award size={16} className="text-purple-600 mr-3" />
                  <span className="text-sm font-medium">Tier Upgrades</span>
                </div>
                <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                  7
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Detail Modal */}
      {showCreatorModal && selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Creator Details</h3>
                <button
                  onClick={() => setShowCreatorModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Creator Info */}
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {selectedCreator.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">@{selectedCreator.username}</h4>
                      <p className="text-gray-600">{selectedCreator.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {getTierIcon(selectedCreator.tier)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(selectedCreator.tier)}`}>
                          {selectedCreator.tier.charAt(0).toUpperCase() + selectedCreator.tier.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Joined</label>
                      <p className="text-gray-900">
                        {new Date(selectedCreator.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Active</label>
                      <p className="text-gray-900">
                        {new Date(selectedCreator.lastActive).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCreator.status)}`}>
                        {getStatusText(selectedCreator.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedCreator.metrics.totalUploads}
                      </div>
                      <div className="text-sm text-gray-600">Total Videos</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedCreator.metrics.totalViews.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Views</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedCreator.metrics.totalBookings}
                      </div>
                      <div className="text-sm text-gray-600">Bookings Generated</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedCreator.metrics.totalEarnings)}
                      </div>
                      <div className="text-sm text-gray-600">Total Earnings</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <span className="font-semibold">{selectedCreator.metrics.averageQuality}/10</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <span className="font-semibold">{selectedCreator.metrics.engagementRate}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending Payout</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedCreator.payoutInfo.pendingAmount)}
                      </span>
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