'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  Download,
  Calendar,
  MapPin,
  User,
  Video,
  Camera,
  FileText,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  Globe,
  Zap
} from 'lucide-react'

interface ContentMetrics {
  contentId: string
  title: string
  type: 'video' | 'photo' | 'article' | 'gallery'
  destination: {
    iataCode: string
    cityName: string
    countryName: string
  }
  creator: {
    id: string
    username: string
    name: string
  }
  publishedAt: string
  metrics: {
    views: number
    uniqueViews: number
    likes: number
    shares: number
    comments: number
    saves: number
    clickThroughRate: number
    engagementRate: number
    retentionRate: number
    conversionRate: number
  }
  trends: {
    views: number
    likes: number
    shares: number
    engagement: number
  }
  demographics: {
    topCountries: Array<{ country: string; percentage: number }>
    ageGroups: Array<{ range: string; percentage: number }>
    devices: Array<{ device: string; percentage: number }>
  }
}

interface PerformanceStats {
  totalViews: number
  totalEngagement: number
  averageEngagementRate: number
  topPerformingContent: string
  totalCreators: number
  activeDestinations: number
  conversionRate: number
  revenueGenerated: number
}

interface TimeRangeData {
  period: string
  views: number
  engagement: number
  conversions: number
  revenue: number
}

export default function ContentPerformancePage() {
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics[]>([])
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [timeRangeData, setTimeRangeData] = useState<TimeRangeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('views')
  const [filterType, setFilterType] = useState('all')
  const [filterDestination, setFilterDestination] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('views')

  // Mock data
  const mockStats: PerformanceStats = {
    totalViews: 2847593,
    totalEngagement: 456789,
    averageEngagementRate: 16.7,
    topPerformingContent: 'Barcelona Street Art Tour',
    totalCreators: 1247,
    activeDestinations: 89,
    conversionRate: 18.5,
    revenueGenerated: 1247500
  }

  const mockTimeRangeData: TimeRangeData[] = [
    { period: 'Week 1', views: 245000, engagement: 35000, conversions: 1200, revenue: 89000 },
    { period: 'Week 2', views: 267000, engagement: 41000, conversions: 1450, revenue: 102000 },
    { period: 'Week 3', views: 298000, engagement: 48000, conversions: 1680, revenue: 118000 },
    { period: 'Week 4', views: 312000, engagement: 52000, conversions: 1890, revenue: 134000 },
  ]

  const mockContentMetrics: ContentMetrics[] = [
    {
      contentId: '1',
      title: 'Barcelona Street Art Walking Tour',
      type: 'video',
      destination: {
        iataCode: 'BCN',
        cityName: 'Barcelona',
        countryName: 'Spain'
      },
      creator: {
        id: '1',
        username: 'art_wanderer',
        name: 'Maria Santos'
      },
      publishedAt: '2024-01-15T10:00:00Z',
      metrics: {
        views: 125847,
        uniqueViews: 98234,
        likes: 8945,
        shares: 1234,
        comments: 567,
        saves: 3421,
        clickThroughRate: 12.5,
        engagementRate: 18.9,
        retentionRate: 67.8,
        conversionRate: 15.2
      },
      trends: {
        views: 23.5,
        likes: 18.7,
        shares: -2.1,
        engagement: 14.3
      },
      demographics: {
        topCountries: [
          { country: 'Spain', percentage: 34 },
          { country: 'France', percentage: 18 },
          { country: 'Germany', percentage: 15 }
        ],
        ageGroups: [
          { range: '25-34', percentage: 42 },
          { range: '18-24', percentage: 28 },
          { range: '35-44', percentage: 20 }
        ],
        devices: [
          { device: 'Mobile', percentage: 68 },
          { device: 'Desktop', percentage: 25 },
          { device: 'Tablet', percentage: 7 }
        ]
      }
    },
    {
      contentId: '2',
      title: 'Hidden Gems of Prague',
      type: 'gallery',
      destination: {
        iataCode: 'PRG',
        cityName: 'Prague',
        countryName: 'Czech Republic'
      },
      creator: {
        id: '2',
        username: 'prague_lens',
        name: 'David Novak'
      },
      publishedAt: '2024-01-12T15:00:00Z',
      metrics: {
        views: 87632,
        uniqueViews: 72101,
        likes: 6234,
        shares: 892,
        comments: 345,
        saves: 2156,
        clickThroughRate: 9.8,
        engagementRate: 15.4,
        retentionRate: 72.1,
        conversionRate: 13.7
      },
      trends: {
        views: 15.2,
        likes: 12.8,
        shares: 8.4,
        engagement: 11.6
      },
      demographics: {
        topCountries: [
          { country: 'Czech Republic', percentage: 28 },
          { country: 'Germany', percentage: 22 },
          { country: 'Austria', percentage: 18 }
        ],
        ageGroups: [
          { range: '25-34', percentage: 38 },
          { range: '35-44', percentage: 32 },
          { range: '18-24', percentage: 22 }
        ],
        devices: [
          { device: 'Desktop', percentage: 45 },
          { device: 'Mobile', percentage: 42 },
          { device: 'Tablet', percentage: 13 }
        ]
      }
    },
    {
      contentId: '3',
      title: 'Amsterdam Coffee Culture Deep Dive',
      type: 'article',
      destination: {
        iataCode: 'AMS',
        cityName: 'Amsterdam',
        countryName: 'Netherlands'
      },
      creator: {
        id: '3',
        username: 'coffee_nomad',
        name: 'Emma Johnson'
      },
      publishedAt: '2024-01-18T08:30:00Z',
      metrics: {
        views: 64523,
        uniqueViews: 58109,
        likes: 4567,
        shares: 678,
        comments: 234,
        saves: 1890,
        clickThroughRate: 14.2,
        engagementRate: 22.1,
        retentionRate: 89.3,
        conversionRate: 19.8
      },
      trends: {
        views: 8.9,
        likes: 16.4,
        shares: 5.7,
        engagement: 19.2
      },
      demographics: {
        topCountries: [
          { country: 'Netherlands', percentage: 41 },
          { country: 'Belgium', percentage: 19 },
          { country: 'United Kingdom', percentage: 15 }
        ],
        ageGroups: [
          { range: '25-34', percentage: 45 },
          { range: '18-24', percentage: 31 },
          { range: '35-44', percentage: 18 }
        ],
        devices: [
          { device: 'Mobile', percentage: 72 },
          { device: 'Desktop', percentage: 21 },
          { device: 'Tablet', percentage: 7 }
        ]
      }
    },
    {
      contentId: '4',
      title: 'Rome Sunrise Photography Series',
      type: 'photo',
      destination: {
        iataCode: 'ROM',
        cityName: 'Rome',
        countryName: 'Italy'
      },
      creator: {
        id: '4',
        username: 'roman_photographer',
        name: 'Alessandro Rossi'
      },
      publishedAt: '2024-01-20T06:00:00Z',
      metrics: {
        views: 45231,
        uniqueViews: 41208,
        likes: 3892,
        shares: 456,
        comments: 178,
        saves: 1567,
        clickThroughRate: 8.9,
        engagementRate: 17.6,
        retentionRate: 91.2,
        conversionRate: 11.4
      },
      trends: {
        views: -3.2,
        likes: 2.1,
        shares: -1.4,
        engagement: 4.7
      },
      demographics: {
        topCountries: [
          { country: 'Italy', percentage: 52 },
          { country: 'United States', percentage: 16 },
          { country: 'France', percentage: 12 }
        ],
        ageGroups: [
          { range: '35-44', percentage: 39 },
          { range: '25-34', percentage: 33 },
          { range: '45-54', percentage: 21 }
        ],
        devices: [
          { device: 'Mobile', percentage: 58 },
          { device: 'Desktop', percentage: 32 },
          { device: 'Tablet', percentage: 10 }
        ]
      }
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setContentMetrics(mockContentMetrics)
        setStats(mockStats)
        setTimeRangeData(mockTimeRangeData)
      } catch (error) {
        console.error('Failed to load performance data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [selectedTimeRange])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-red-500" />
      case 'photo': return <Camera size={16} className="text-blue-500" />
      case 'article': return <FileText size={16} className="text-green-500" />
      case 'gallery': return <Star size={16} className="text-purple-500" />
      default: return <FileText size={16} />
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp size={16} className="text-green-500" />
    if (trend < 0) return <TrendingDown size={16} className="text-red-500" />
    return <Minus size={16} className="text-gray-500" />
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount)
  }

  const filteredMetrics = contentMetrics.filter(content => {
    if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !content.creator.username.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && content.type !== filterType) return false
    if (filterDestination !== 'all' && content.destination.iataCode !== filterDestination) return false
    return true
  })

  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    switch (sortBy) {
      case 'views': return b.metrics.views - a.metrics.views
      case 'engagement': return b.metrics.engagementRate - a.metrics.engagementRate
      case 'conversion': return b.metrics.conversionRate - a.metrics.conversionRate
      case 'recent': return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      default: return 0
    }
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
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
          <h1 className="text-2xl font-bold text-gray-900">Content Performance</h1>
          <p className="text-gray-600">Analytics and insights for all content across destinations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <RefreshCw size={16} className="mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
          <div className="flex items-center space-x-2">
            {['7d', '30d', '90d', '1y'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeRange(period)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedTimeRange === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Views</div>
            <Eye size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalViews || 0)}</div>
          <div className="flex items-center text-sm text-green-600 mt-1">
            <TrendingUp size={14} className="mr-1" />
            +18.5% vs last period
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Engagement Rate</div>
            <Heart size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.averageEngagementRate.toFixed(1)}%</div>
          <div className="flex items-center text-sm text-green-600 mt-1">
            <TrendingUp size={14} className="mr-1" />
            +2.3% vs last period
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Conversion Rate</div>
            <Target size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.conversionRate.toFixed(1)}%</div>
          <div className="flex items-center text-sm text-green-600 mt-1">
            <TrendingUp size={14} className="mr-1" />
            +1.2% vs last period
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Revenue Impact</div>
            <Award size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenueGenerated || 0)}</div>
          <div className="flex items-center text-sm text-green-600 mt-1">
            <TrendingUp size={14} className="mr-1" />
            +22.7% vs last period
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="views">Views</option>
                <option value="engagement">Engagement</option>
                <option value="conversions">Conversions</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">Interactive Performance Chart</p>
              <p className="text-sm text-gray-500 mt-2">
                Chart showing {selectedMetric} trends over {selectedTimeRange}
              </p>
              <div className="grid grid-cols-4 gap-4 mt-6 max-w-md mx-auto">
                {timeRangeData.map((data, index) => (
                  <div key={index} className="text-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-sm font-medium text-gray-900">{data.period}</div>
                    <div className="text-lg font-bold text-blue-600">
                      {selectedMetric === 'views' && formatNumber(data.views)}
                      {selectedMetric === 'engagement' && formatNumber(data.engagement)}
                      {selectedMetric === 'conversions' && formatNumber(data.conversions)}
                      {selectedMetric === 'revenue' && formatCurrency(data.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Content Performance Breakdown</h3>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="photo">Photos</option>
                <option value="article">Articles</option>
                <option value="gallery">Galleries</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="views">Most Viewed</option>
                <option value="engagement">Highest Engagement</option>
                <option value="conversion">Best Conversion</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Content</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Performance</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Engagement</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Conversion</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Trends</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMetrics.map((content) => (
                <tr key={content.contentId} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(content.type)}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{content.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <User size={12} />
                          <span>@{content.creator.username}</span>
                          <span>•</span>
                          <MapPin size={12} />
                          <span>{content.destination.iataCode}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Eye size={14} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{formatNumber(content.metrics.views)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(content.metrics.uniqueViews)} unique
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Heart size={12} className="text-red-500" />
                          <span>{formatNumber(content.metrics.likes)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share2 size={12} className="text-blue-500" />
                          <span>{formatNumber(content.metrics.shares)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare size={12} className="text-green-500" />
                          <span>{formatNumber(content.metrics.comments)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {content.metrics.engagementRate.toFixed(1)}% engagement rate
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        {content.metrics.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        CTR: {content.metrics.clickThroughRate.toFixed(1)}%
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(content.trends.views)}
                        <span className={`text-sm font-medium ${
                          content.trends.views > 0 ? 'text-green-600' : 
                          content.trends.views < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {content.trends.views > 0 ? '+' : ''}{content.trends.views.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">vs last period</div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-700">
                        <BarChart3 size={16} />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-700">
                        <ArrowUpRight size={16} />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-700">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Content</h3>
          
          <div className="space-y-4">
            {sortedMetrics.slice(0, 3).map((content, index) => (
              <div key={content.contentId} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{content.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatNumber(content.metrics.views)} views</span>
                    <span>{content.metrics.engagementRate.toFixed(1)}% engagement</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-green-600">
                  <TrendingUp size={14} />
                  <span className="text-sm font-medium">+{content.trends.views.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <TrendingUp size={16} className="text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-900">Video Content Excelling</h4>
                <p className="text-sm text-green-700">Video content shows 23% higher engagement than other formats.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Globe size={16} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Barcelona Leading</h4>
                <p className="text-sm text-blue-700">Barcelona content generates 40% more conversions than average.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock size={16} className="text-orange-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-orange-900">Optimal Timing</h4>
                <p className="text-sm text-orange-700">Content published 9-11 AM shows best performance.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Users size={16} className="text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-900">Creator Success</h4>
                <p className="text-sm text-purple-700">Top 10% creators drive 60% of total engagement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}