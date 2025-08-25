'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Video, 
  MapPin, 
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Calendar,
  ArrowUpRight,
  BarChart3,
  Star,
  Target,
  Globe,
  Grid,
  List,
  Filter,
  Search,
  Plus,
  Edit,
  Flag,
  Settings,
  Play,
  FileText,
  Zap
} from 'lucide-react'
import { BusinessMetrics } from '@/types/admin'

interface DestinationMetricCard {
  title: string
  value: string | number
  subtitle: string
  change: number
  changeLabel: string
  icon: React.ComponentType<{ size?: string | number; className?: string }>
  color: string
  actionLabel?: string
  onClick?: () => void
}

interface TopDestination {
  id: string
  iataCode: string
  cityName: string
  countryName: string
  popularityScore: number
  contentCount: number
  videoCount: number
  themeCoverage: number
  bookings: number
  revenue: number
  isActive: boolean
  isFeatured: boolean
  thumbnailUrl?: string
  trending?: 'up' | 'down' | 'stable'
}

interface ContentPipelineItem {
  id: string
  type: 'video' | 'theme' | 'destination'
  title: string
  creator: string
  destination: string
  submittedAt: string
  status: 'pending' | 'review' | 'approved' | 'rejected'
  thumbnailUrl?: string
  qualityScore?: number
}

interface RecentActivity {
  id: string
  type: 'destination_created' | 'theme_updated' | 'video_approved' | 'content_published' | 'creator_joined'
  description: string
  timestamp: string
  user?: string
  entityId?: string
  entityType?: 'destination' | 'theme' | 'video' | 'creator'
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([])
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterTheme, setFilterTheme] = useState('all')
  const [filterPerformance, setFilterPerformance] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data for destination-focused dashboard
  const mockTopDestinations: TopDestination[] = [
    {
      id: 'bcn',
      iataCode: 'BCN',
      cityName: 'Barcelona',
      countryName: 'Spain',
      popularityScore: 9.2,
      contentCount: 234,
      videoCount: 89,
      themeCoverage: 85,
      bookings: 3456,
      revenue: 287500,
      isActive: true,
      isFeatured: true,
      trending: 'up',
      thumbnailUrl: '/images/destinations/barcelona.jpg'
    },
    {
      id: 'ams',
      iataCode: 'AMS', 
      cityName: 'Amsterdam',
      countryName: 'Netherlands',
      popularityScore: 8.7,
      contentCount: 189,
      videoCount: 67,
      themeCoverage: 78,
      bookings: 2890,
      revenue: 234500,
      isActive: true,
      isFeatured: true,
      trending: 'up',
      thumbnailUrl: '/images/destinations/amsterdam.jpg'
    },
    {
      id: 'rom',
      iataCode: 'ROM',
      cityName: 'Rome', 
      countryName: 'Italy',
      popularityScore: 8.9,
      contentCount: 156,
      videoCount: 45,
      themeCoverage: 72,
      bookings: 2345,
      revenue: 198750,
      isActive: true,
      isFeatured: false,
      trending: 'stable',
      thumbnailUrl: '/images/destinations/rome.jpg'
    },
    {
      id: 'prg',
      iataCode: 'PRG',
      cityName: 'Prague',
      countryName: 'Czech Republic', 
      popularityScore: 7.8,
      contentCount: 78,
      videoCount: 23,
      themeCoverage: 45,
      bookings: 1234,
      revenue: 98750,
      isActive: false,
      isFeatured: false,
      trending: 'down',
      thumbnailUrl: '/images/destinations/prague.jpg'
    }
  ]

  const mockContentPipeline: ContentPipelineItem[] = [
    {
      id: '1',
      type: 'video',
      title: 'Berlin Street Art Walking Tour',
      creator: 'art_lover_23',
      destination: 'Berlin',
      submittedAt: '2 hours ago',
      status: 'pending',
      qualityScore: 8.6,
      thumbnailUrl: '/images/content/berlin-art.jpg'
    },
    {
      id: '2', 
      type: 'theme',
      title: 'Winter Markets Theme for Prague',
      creator: 'prague_expert',
      destination: 'Prague',
      submittedAt: '4 hours ago',
      status: 'review',
      thumbnailUrl: '/images/themes/winter-markets.jpg'
    },
    {
      id: '3',
      type: 'video',
      title: 'Amsterdam Coffee Culture Guide',
      creator: 'coffee_nomad', 
      destination: 'Amsterdam',
      submittedAt: '6 hours ago',
      status: 'approved',
      qualityScore: 9.1,
      thumbnailUrl: '/images/content/amsterdam-coffee.jpg'
    }
  ]

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'video_approved',
      description: 'Approved "Berlin Street Art Tour" for Berlin',
      timestamp: '2 minutes ago',
      user: 'art_lover_23',
      entityType: 'video',
      entityId: 'video_berlin_art'
    },
    {
      id: '2',
      type: 'destination_created',
      description: 'New destination "Vienna" added to platform',
      timestamp: '15 minutes ago',
      user: 'admin_user',
      entityType: 'destination',
      entityId: 'vie'
    },
    {
      id: '3',
      type: 'theme_updated',
      description: 'Updated "Food & Drink" theme for Barcelona',
      timestamp: '32 minutes ago',
      user: 'content_curator',
      entityType: 'theme',
      entityId: 'bcn_food'
    },
    {
      id: '4',
      type: 'creator_joined',
      description: 'New creator joined with Prague specialization',
      timestamp: '1 hour ago',
      user: 'prague_local',
      entityType: 'creator',
      entityId: 'creator_123'
    },
    {
      id: '5',
      type: 'content_published',
      description: '3 new videos published for Amsterdam themes',
      timestamp: '2 hours ago',
      user: 'content_scheduler',
      entityType: 'destination',
      entityId: 'ams'
    }
  ]

  // Destination-focused metrics
  const destinationMetrics: DestinationMetricCard[] = [
    {
      title: 'Active Destinations',
      value: 42,
      subtitle: '89% with videos',
      change: 12.5,
      changeLabel: 'vs last month',
      icon: MapPin,
      color: 'text-blue-600',
      actionLabel: 'Browse All',
      onClick: () => window.location.href = '/admin/destinations/manage'
    },
    {
      title: 'Content Coverage',
      value: '78%',
      subtitle: '3.2 videos per destination avg',
      change: 15.3,
      changeLabel: 'vs last month',
      icon: Video,
      color: 'text-green-600',
      actionLabel: 'View Content',
      onClick: () => window.location.href = '/admin/content/library'
    },
    {
      title: 'Creator Activity',
      value: 23,
      subtitle: 'new content this week',
      change: -5.2,
      changeLabel: 'vs last week',
      icon: Users,
      color: 'text-purple-600',
      actionLabel: 'Review Queue',
      onClick: () => window.location.href = '/admin/content/queue'
    },
    {
      title: 'Theme Completion',
      value: '85%',
      subtitle: 'avg coverage per destination',
      change: 8.7,
      changeLabel: 'vs last month',
      icon: Star,
      color: 'text-orange-600',
      actionLabel: 'Manage Themes',
      onClick: () => window.location.href = '/admin/destinations/themes'
    },
    {
      title: 'User Engagement',
      value: '4.2m',
      subtitle: 'weekly active users',
      change: 18.9,
      changeLabel: 'vs last month',
      icon: Activity,
      color: 'text-indigo-600'
    },
    {
      title: 'Monthly Revenue',
      value: '€1.2M',
      subtitle: '16.2% conversion rate',
      change: 22.1,
      changeLabel: 'vs last month',
      icon: DollarSign,
      color: 'text-emerald-600',
      actionLabel: 'View Details'
    }
  ]

  useEffect(() => {
    // Simulate API call for loading dashboard data
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [selectedPeriod])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video_approved': return <CheckCircle size={16} className="text-green-500" />
      case 'destination_created': return <MapPin size={16} className="text-blue-500" />
      case 'theme_updated': return <Star size={16} className="text-orange-500" />
      case 'creator_joined': return <Users size={16} className="text-purple-500" />
      case 'content_published': return <FileText size={16} className="text-indigo-500" />
      default: return <Activity size={16} className="text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'review': return 'text-blue-600 bg-blue-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount)
  }

  const toggleDestinationSelection = (destinationId: string) => {
    setSelectedDestinations(prev => 
      prev.includes(destinationId) 
        ? prev.filter(id => id !== destinationId)
        : [...prev, destinationId]
    )
  }

  const filteredDestinations = mockTopDestinations.filter(dest => {
    if (searchQuery && !dest.cityName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !dest.countryName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterRegion !== 'all' && filterRegion !== dest.countryName) return false
    if (filterPerformance === 'high' && dest.popularityScore < 8.5) return false
    if (filterPerformance === 'low' && dest.popularityScore >= 7.0) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Destination Curation Dashboard</h1>
          <p className="text-gray-600">Manage destinations, themes, and content across your travel platform</p>
        </div>
        
        {/* Quick Create */}
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            {['7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} className="mr-2" />
            New Destination
          </button>
        </div>
      </div>

      {/* Key Metrics Row - Destination Focused */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinationMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${metric.color} bg-opacity-10`}>
                <metric.icon size={20} className={metric.color} />
              </div>
              <div className={`flex items-center text-sm ${
                metric.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change >= 0 ? (
                  <TrendingUp size={14} className="mr-1" />
                ) : (
                  <TrendingDown size={14} className="mr-1" />
                )}
                {Math.abs(metric.change)}%
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <p className="text-sm font-medium text-gray-700">{metric.title}</p>
              <p className="text-xs text-gray-500 mb-3">{metric.subtitle}</p>
              <p className="text-xs text-gray-400">{metric.changeLabel}</p>
              
              {metric.actionLabel && metric.onClick && (
                <button 
                  onClick={metric.onClick}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  {metric.actionLabel}
                  <ArrowUpRight size={12} className="ml-1" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Destination Management Widget - Primary Focus */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Destination Management</h3>
                <p className="text-sm text-gray-600">Top performing destinations with quick actions</p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-3 py-2 w-48 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                
                {/* Filters */}
                <select
                  value={filterPerformance}
                  onChange={(e) => setFilterPerformance(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Performance</option>
                  <option value="high">High Performers</option>
                  <option value="low">Needs Attention</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedDestinations.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedDestinations.length} destinations selected
                </span>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Bulk Edit Themes
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                    Feature Selected
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                    Export Data
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Destinations Grid/List */}
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredDestinations.map((destination) => (
                  <div
                    key={destination.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                      selectedDestinations.includes(destination.id) 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleDestinationSelection(destination.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{destination.iataCode}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{destination.cityName}</h4>
                          <p className="text-sm text-gray-600">{destination.countryName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {destination.isFeatured && <Star size={14} className="text-yellow-500" />}
                        {destination.trending === 'up' && <TrendingUp size={14} className="text-green-500" />}
                        {destination.trending === 'down' && <TrendingDown size={14} className="text-red-500" />}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          destination.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {destination.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{destination.videoCount}</div>
                        <div className="text-gray-600">Videos</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{destination.themeCoverage}%</div>
                        <div className="text-gray-600">Themes</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{destination.popularityScore}</div>
                        <div className="text-gray-600">Score</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-semibold text-green-600">{formatCurrency(destination.revenue)}</span>
                        <span className="text-gray-500 ml-2">from {destination.bookings.toLocaleString()} bookings</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit size={14} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                          <Play size={14} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-orange-600 transition-colors">
                          <Flag size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDestinations.map((destination) => (
                  <div
                    key={destination.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer ${
                      selectedDestinations.includes(destination.id) 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleDestinationSelection(destination.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{destination.iataCode}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{destination.cityName}, {destination.countryName}</div>
                        <div className="text-sm text-gray-600">
                          {destination.videoCount} videos • {destination.themeCoverage}% theme coverage
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{destination.popularityScore}</div>
                        <div className="text-gray-600">Score</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{formatCurrency(destination.revenue)}</div>
                        <div className="text-gray-600">Revenue</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {destination.isFeatured && <Star size={14} className="text-yellow-500" />}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          destination.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {destination.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Pipeline Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Content Pipeline</h3>
            <p className="text-sm text-gray-600">Content awaiting review</p>
          </div>
          
          <div className="p-4 space-y-3">
            {mockContentPipeline.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{item.title}</h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>@{item.creator}</span>
                      <span>•</span>
                      <span>{item.destination}</span>
                      <span>•</span>
                      <span>{item.submittedAt}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                
                {item.qualityScore && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Quality Score</span>
                    <span className="font-semibold text-green-600">{item.qualityScore}/10</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mt-3">
                  <button className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                    Approve
                  </button>
                  <button className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
                    Review
                  </button>
                </div>
              </div>
            ))}
            
            <button className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All Pipeline Items
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    {activity.user && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-blue-600">@{activity.user}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center">
                <MapPin size={16} className="text-blue-600 mr-3" />
                <span className="text-sm font-medium">Add New Destination</span>
              </div>
              <Plus size={16} className="text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <div className="flex items-center">
                <Star size={16} className="text-orange-600 mr-3" />
                <span className="text-sm font-medium">Manage Themes</span>
              </div>
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                12 gaps
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="flex items-center">
                <Video size={16} className="text-green-600 mr-3" />
                <span className="text-sm font-medium">Review Content</span>
              </div>
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                {mockContentPipeline.filter(item => item.status === 'pending').length}
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="flex items-center">
                <Target size={16} className="text-purple-600 mr-3" />
                <span className="text-sm font-medium">Featured Collections</span>
              </div>
              <Settings size={16} className="text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <div className="flex items-center">
                <BarChart3 size={16} className="text-indigo-600 mr-3" />
                <span className="text-sm font-medium">Analytics Overview</span>
              </div>
              <ArrowUpRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}