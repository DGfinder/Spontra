'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  DollarSign,
  Video,
  Camera,
  FileText,
  Calendar,
  MapPin,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Globe,
  Zap,
  Crown,
  Gift
} from 'lucide-react'

interface CreatorAnalytics {
  creatorId: string
  name: string
  username: string
  avatar?: string
  level: 'bronze' | 'silver' | 'gold' | 'diamond'
  verified: boolean
  metrics: {
    totalContent: number
    totalViews: number
    totalLikes: number
    totalShares: number
    totalEarnings: number
    engagementRate: number
    averageQuality: number
    contentApprovalRate: number
  }
  performance: {
    viewsTrend: number
    likesTorend: number
    earningsTrend: number
    engagementTrend: number
  }
  topContent: Array<{
    id: string
    title: string
    type: 'video' | 'photo' | 'article'
    views: number
    engagement: number
  }>
  monthlyData: Array<{
    month: string
    views: number
    earnings: number
    content: number
    engagement: number
  }>
}

interface AnalyticsOverview {
  totalCreators: number
  totalContent: number
  totalViews: number
  totalEarnings: number
  averageEngagement: number
  topDestinations: Array<{ destination: string; creators: number; content: number }>
  contentTypeDistribution: Array<{ type: string; count: number; percentage: number }>
  tierPerformance: Array<{ tier: string; avgEarnings: number; avgQuality: number; creators: number }>
}

export default function CreatorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CreatorAnalytics[]>([])
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('views')
  const [filterLevel, setFilterLevel] = useState('all')
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null)

  // Mock data
  const mockOverview: AnalyticsOverview = {
    totalCreators: 1247,
    totalContent: 8934,
    totalViews: 15678900,
    totalEarnings: 547800,
    averageEngagement: 16.8,
    topDestinations: [
      { destination: 'Barcelona', creators: 89, content: 456 },
      { destination: 'Rome', creators: 76, content: 389 },
      { destination: 'Prague', creators: 65, content: 298 },
      { destination: 'Amsterdam', creators: 58, content: 267 },
      { destination: 'Paris', creators: 52, content: 245 }
    ],
    contentTypeDistribution: [
      { type: 'Photo', count: 4567, percentage: 51.1 },
      { type: 'Video', count: 2890, percentage: 32.4 },
      { type: 'Article', count: 1234, percentage: 13.8 },
      { type: 'Gallery', count: 243, percentage: 2.7 }
    ],
    tierPerformance: [
      { tier: 'Diamond', avgEarnings: 2450, avgQuality: 9.1, creators: 34 },
      { tier: 'Gold', avgEarnings: 1280, avgQuality: 8.4, creators: 127 },
      { tier: 'Silver', avgEarnings: 650, avgQuality: 7.6, creators: 398 },
      { tier: 'Bronze', avgEarnings: 280, avgQuality: 6.8, creators: 688 }
    ]
  }

  const mockAnalytics: CreatorAnalytics[] = [
    {
      creatorId: '1',
      name: 'Sarah Johnson',
      username: 'travel_sarah',
      avatar: '/images/creators/sarah.jpg',
      level: 'diamond',
      verified: true,
      metrics: {
        totalContent: 156,
        totalViews: 2456789,
        totalLikes: 189234,
        totalShares: 45678,
        totalEarnings: 12450,
        engagementRate: 18.7,
        averageQuality: 9.2,
        contentApprovalRate: 94.2
      },
      performance: {
        viewsTrend: 23.5,
        likesTorend: 18.9,
        earningsTrend: 31.2,
        engagementTrend: 12.4
      },
      topContent: [
        { id: '1', title: 'Barcelona Street Art Tour', type: 'video', views: 125000, engagement: 19.8 },
        { id: '2', title: 'Hidden Gems Photography', type: 'photo', views: 98000, engagement: 17.2 },
        { id: '3', title: 'Local Food Guide', type: 'article', views: 76000, engagement: 21.5 }
      ],
      monthlyData: [
        { month: 'Oct', views: 189000, earnings: 1890, content: 12, engagement: 17.2 },
        { month: 'Nov', views: 234000, earnings: 2340, content: 15, engagement: 18.1 },
        { month: 'Dec', views: 278000, earnings: 2780, content: 18, engagement: 18.9 },
        { month: 'Jan', views: 312000, earnings: 3120, content: 21, engagement: 19.4 }
      ]
    },
    {
      creatorId: '2',
      name: 'David Novak',
      username: 'prague_lens',
      avatar: '/images/creators/david.jpg',
      level: 'gold',
      verified: true,
      metrics: {
        totalContent: 89,
        totalViews: 1234567,
        totalLikes: 98765,
        totalShares: 23456,
        totalEarnings: 7890,
        engagementRate: 15.2,
        averageQuality: 8.7,
        contentApprovalRate: 87.6
      },
      performance: {
        viewsTrend: 15.8,
        likesTorend: 12.3,
        earningsTrend: 18.9,
        engagementTrend: 8.7
      },
      topContent: [
        { id: '1', title: 'Prague Architecture Guide', type: 'photo', views: 87000, engagement: 16.8 },
        { id: '2', title: 'Castle District Tour', type: 'video', views: 65000, engagement: 14.9 },
        { id: '3', title: 'Photography Tips', type: 'article', views: 43000, engagement: 18.2 }
      ],
      monthlyData: [
        { month: 'Oct', views: 98000, earnings: 980, content: 8, engagement: 14.8 },
        { month: 'Nov', views: 123000, earnings: 1230, content: 10, engagement: 15.2 },
        { month: 'Dec', views: 145000, earnings: 1450, content: 12, engagement: 15.6 },
        { month: 'Jan', views: 167000, earnings: 1670, content: 14, engagement: 16.1 }
      ]
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAnalytics(mockAnalytics)
        setOverview(mockOverview)
      } catch (error) {
        console.error('Failed to load analytics data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [selectedTimeRange])

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

  const getLevelBadge = (level: string) => {
    const badges = {
      bronze: 'text-orange-700 bg-orange-100',
      silver: 'text-gray-700 bg-gray-100',
      gold: 'text-yellow-700 bg-yellow-100',
      diamond: 'text-blue-700 bg-blue-100'
    }
    return badges[level as keyof typeof badges] || badges.bronze
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight size={16} className="text-green-500" />
    if (trend < 0) return <ArrowDownRight size={16} className="text-red-500" />
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Creator Analytics</h1>
          <p className="text-gray-600">Performance insights and metrics for content creators</p>
        </div>
        
        <div className="flex items-center space-x-3">
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
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Creators</div>
            <Users size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{overview?.totalCreators.toLocaleString()}</div>
          <div className="text-sm text-blue-600">Active community</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Views</div>
            <Eye size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(overview?.totalViews || 0)}</div>
          <div className="text-sm text-green-600">+24% vs last period</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Content</div>
            <Activity size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(overview?.totalContent || 0)}</div>
          <div className="text-sm text-purple-600">Items published</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Earnings</div>
            <DollarSign size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.totalEarnings || 0)}</div>
          <div className="text-sm text-orange-600">Paid to creators</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Engagement</div>
            <Heart size={20} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{overview?.averageEngagement.toFixed(1)}%</div>
          <div className="text-sm text-red-600">Engagement rate</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Creator Performance Trends</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="views">Views</option>
                <option value="earnings">Earnings</option>
                <option value="engagement">Engagement</option>
                <option value="content">Content</option>
              </select>
            </div>
          </div>
          
          <div className="p-6">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Performance Chart</p>
                <p className="text-sm text-gray-500 mt-2">
                  Showing {selectedMetric} trends over {selectedTimeRange}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Content Type Distribution</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {overview?.contentTypeDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'Video' ? 'text-red-500 bg-red-100' :
                      item.type === 'Photo' ? 'text-blue-500 bg-blue-100' :
                      item.type === 'Article' ? 'text-green-500 bg-green-100' :
                      'text-purple-500 bg-purple-100'
                    }`}>
                      {item.type === 'Video' && <Video size={16} />}
                      {item.type === 'Photo' && <Camera size={16} />}
                      {item.type === 'Article' && <FileText size={16} />}
                      {item.type === 'Gallery' && <Star size={16} />}
                    </div>
                    <span className="font-medium text-gray-900">{item.type}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 min-w-[4rem] text-right">
                      <div className="font-semibold text-gray-900">{formatNumber(item.count)}</div>
                      <div>{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Destinations & Tier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Destinations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Destinations by Creator Activity</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {overview?.topDestinations.map((destination, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{destination.destination}</div>
                      <div className="text-sm text-gray-600">{destination.content} content items</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{destination.creators}</div>
                    <div className="text-sm text-gray-600">creators</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tier Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performance by Creator Tier</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {overview?.tierPerformance.map((tier, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        tier.tier === 'Diamond' ? 'text-blue-600 bg-blue-100' :
                        tier.tier === 'Gold' ? 'text-yellow-600 bg-yellow-100' :
                        tier.tier === 'Silver' ? 'text-gray-600 bg-gray-100' :
                        'text-orange-600 bg-orange-100'
                      }`}>
                        {tier.tier === 'Diamond' && <Crown size={16} />}
                        {tier.tier === 'Gold' && <Award size={16} />}
                        {tier.tier === 'Silver' && <Star size={16} />}
                        {tier.tier === 'Bronze' && <Target size={16} />}
                      </div>
                      <span className="font-semibold text-gray-900">{tier.tier}</span>
                    </div>
                    <span className="text-sm text-gray-600">{tier.creators} creators</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Avg Earnings</div>
                      <div className="font-semibold text-green-600">{formatCurrency(tier.avgEarnings)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Quality</div>
                      <div className="font-semibold text-blue-600">{tier.avgQuality.toFixed(1)}/10</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Creators */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Creators</h3>
            <div className="flex items-center space-x-2">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="diamond">Diamond</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Creator</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Content</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Performance</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Earnings</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Trends</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.map((creator) => (
                <tr key={creator.creatorId} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{creator.name}</span>
                          {creator.verified && (
                            <div className="bg-blue-500 rounded-full p-1">
                              <Award size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">@{creator.username}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadge(creator.level)}`}>
                            {creator.level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">{creator.metrics.totalContent}</div>
                      <div className="text-sm text-gray-600">
                        {creator.metrics.contentApprovalRate.toFixed(1)}% approved
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Eye size={12} className="text-gray-400" />
                        <span className="text-sm font-medium">{formatNumber(creator.metrics.totalViews)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart size={12} className="text-red-400" />
                        <span className="text-sm">{creator.metrics.engagementRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(creator.metrics.totalEarnings)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Quality: {creator.metrics.averageQuality.toFixed(1)}/10
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(creator.performance.viewsTrend)}
                        <span className={`text-sm font-medium ${
                          creator.performance.viewsTrend > 0 ? 'text-green-600' : 
                          creator.performance.viewsTrend < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {creator.performance.viewsTrend > 0 ? '+' : ''}{creator.performance.viewsTrend.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">Views trend</div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedCreator(creator.creatorId)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Analytics Insights</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp size={20} className="text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Top Performance</h4>
                  <p className="text-sm text-green-700">
                    Diamond tier creators generate 3.8x more engagement than average
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Target size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Growth Opportunity</h4>
                  <p className="text-sm text-blue-700">
                    Video content shows 45% higher engagement rates
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Globe size={20} className="text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900 mb-1">Market Insight</h4>
                  <p className="text-sm text-orange-700">
                    Barcelona content has the highest conversion rate (18.2%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}