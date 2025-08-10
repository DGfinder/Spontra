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
  BarChart3
} from 'lucide-react'
import { BusinessMetrics } from '@/types/admin'

interface MetricCard {
  title: string
  value: string | number
  change: number
  changeLabel: string
  icon: React.ComponentType<{ size?: string | number; className?: string }>
  color: string
}

interface RecentActivity {
  id: string
  type: 'content_approved' | 'user_registered' | 'booking_completed' | 'payout_processed'
  description: string
  timestamp: string
  user?: string
  amount?: string
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  // Mock data - in production this would come from your analytics service
  const mockMetrics: BusinessMetrics = {
    revenue: {
      total: 145230,
      growth: 12.5,
      byPeriod: [
        { period: '2024-01', amount: 32000, bookings: 145, growth: 8.2 },
        { period: '2024-02', amount: 38000, bookings: 167, growth: 18.8 },
        { period: '2024-03', amount: 42000, bookings: 189, growth: 10.5 }
      ],
      bySource: [
        { source: 'Direct Bookings', amount: 98000, percentage: 67.5 },
        { source: 'Creator Referrals', amount: 35000, percentage: 24.1 },
        { source: 'Partnerships', amount: 12230, percentage: 8.4 }
      ]
    },
    users: {
      total: 12450,
      active: 8340,
      new: 234,
      retention: 78.5,
      byTier: [
        { tier: 'Explorer', count: 8920, revenue: 45600 },
        { tier: 'Contributor', count: 2890, revenue: 67800 },
        { tier: 'Ambassador', count: 580, revenue: 28900 },
        { tier: 'Creator', count: 60, revenue: 12930 }
      ]
    },
    content: {
      totalVideos: 3420,
      pendingApproval: 47,
      approvedToday: 23,
      averageQuality: 8.4,
      topPerforming: [
        { id: '1', title: 'Barcelona Nightlife Guide', creator: 'traveler_mike', views: 15600, bookings: 89, revenue: 4450 },
        { id: '2', title: 'Rome Food Adventure', creator: 'foodie_sarah', views: 12300, bookings: 67, revenue: 3350 },
        { id: '3', title: 'Amsterdam Canals Tour', creator: 'city_explorer', views: 9800, bookings: 45, revenue: 2250 }
      ]
    },
    bookings: {
      total: 1890,
      conversionRate: 15.2,
      averageValue: 76.8,
      byDestination: [
        { destination: 'Barcelona', bookings: 345, revenue: 26550, growth: 23.1 },
        { destination: 'Amsterdam', bookings: 289, revenue: 22200, growth: 15.7 },
        { destination: 'Rome', bookings: 234, revenue: 18000, growth: 8.9 }
      ]
    }
  }

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'content_approved',
      description: 'Approved video: "Berlin Street Art Tour"',
      timestamp: '2 minutes ago',
      user: 'art_lover_23'
    },
    {
      id: '2',
      type: 'user_registered',
      description: 'New creator joined the program',
      timestamp: '15 minutes ago',
      user: 'travel_ninja'
    },
    {
      id: '3',
      type: 'booking_completed',
      description: 'Booking completed for Prague adventure',
      timestamp: '32 minutes ago',
      amount: '€89.50'
    },
    {
      id: '4',
      type: 'payout_processed',
      description: 'Creator payout processed',
      timestamp: '1 hour ago',
      user: 'city_explorer',
      amount: '€156.30'
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMetrics(mockMetrics)
      setIsLoading(false)
    }, 1000)
  }, [selectedPeriod])

  const metricCards: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: `€${metrics?.revenue.total.toLocaleString() || '0'}`,
      change: metrics?.revenue.growth || 0,
      changeLabel: 'vs last month',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Users',
      value: metrics?.users.active.toLocaleString() || '0',
      change: 8.2,
      changeLabel: 'vs last week',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Content',
      value: (metrics?.content.pendingApproval || 0).toString(),
      change: -12.5,
      changeLabel: 'vs yesterday',
      icon: Video,
      color: 'text-orange-600'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics?.bookings.conversionRate || 0}%`,
      change: 2.3,
      changeLabel: 'vs last month',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_approved': return <CheckCircle size={16} className="text-green-500" />
      case 'user_registered': return <Users size={16} className="text-blue-500" />
      case 'booking_completed': return <MapPin size={16} className="text-purple-500" />
      case 'payout_processed': return <DollarSign size={16} className="text-green-500" />
      default: return <Activity size={16} className="text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor your Spontra business performance</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
              <p className="text-sm text-gray-600">{metric.title}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.changeLabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Details <ArrowUpRight size={14} className="ml-1" />
            </button>
          </div>
          
          {/* Simple revenue chart placeholder */}
          <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-blue-400 mx-auto mb-4" />
              <p className="text-gray-600">Revenue Chart</p>
              <p className="text-sm text-gray-500">Interactive chart will be implemented</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center">
                <Video size={16} className="text-orange-600 mr-3" />
                <span className="text-sm font-medium">Review Content</span>
              </div>
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                {metrics?.content.pendingApproval}
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="flex items-center">
                <DollarSign size={16} className="text-green-600 mr-3" />
                <span className="text-sm font-medium">Process Payouts</span>
              </div>
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                12
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center">
                <Users size={16} className="text-blue-600 mr-3" />
                <span className="text-sm font-medium">Manage Users</span>
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="flex items-center">
                <BarChart3 size={16} className="text-purple-600 mr-3" />
                <span className="text-sm font-medium">View Analytics</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Content</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {metrics?.content.topPerforming.slice(0, 3).map((content) => (
              <div key={content.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{content.title}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">@{content.creator}</span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Eye size={12} className="mr-1" />
                      {content.views.toLocaleString()}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin size={12} className="mr-1" />
                      {content.bookings}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    €{content.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
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
                    {activity.amount && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-medium text-green-600">{activity.amount}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Footer */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm font-medium text-gray-900">All Systems Operational</span>
            </div>
            <div className="text-xs text-gray-500">Last updated: 2 minutes ago</div>
          </div>
          
          <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
            <Activity size={14} className="mr-1" />
            System Status
          </button>
        </div>
      </div>
    </div>
  )
}