'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'

interface RevenueMetrics {
  totalRevenue: number
  monthlyRecurring: number
  averageOrderValue: number
  conversionRate: number
  growthRate: number
  revenueByMonth: Array<{
    month: string
    revenue: number
    bookings: number
    growth: number
  }>
  revenueBySource: Array<{
    source: string
    amount: number
    percentage: number
    growth: number
  }>
  revenueByDestination: Array<{
    destination: string
    revenue: number
    bookings: number
    averageValue: number
    growth: number
  }>
  creatorCommissions: {
    total: number
    thisMonth: number
    topEarners: Array<{
      creator: string
      earnings: number
      bookings: number
    }>
  }
}

export default function RevenueAnalytics() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('3m')
  const [selectedView, setSelectedView] = useState<'overview' | 'sources' | 'destinations' | 'creators'>('overview')

  // Mock data - in production this would come from analytics service
  const mockMetrics: RevenueMetrics = {
    totalRevenue: 487650,
    monthlyRecurring: 145230,
    averageOrderValue: 89.45,
    conversionRate: 15.7,
    growthRate: 23.4,
    revenueByMonth: [
      { month: 'Oct 2023', revenue: 98500, bookings: 1120, growth: 8.2 },
      { month: 'Nov 2023', revenue: 112300, bookings: 1287, growth: 14.0 },
      { month: 'Dec 2023', revenue: 134200, bookings: 1456, growth: 19.5 },
      { month: 'Jan 2024', revenue: 142750, bookings: 1589, growth: 6.4 },
      { month: 'Feb 2024', revenue: 155890, bookings: 1723, growth: 9.2 },
      { month: 'Mar 2024', revenue: 174650, bookings: 1892, growth: 12.0 }
    ],
    revenueBySource: [
      { source: 'Direct Bookings', amount: 298450, percentage: 61.2, growth: 18.5 },
      { source: 'Creator Referrals', amount: 134890, percentage: 27.7, growth: 31.2 },
      { source: 'Partner Networks', amount: 35650, percentage: 7.3, growth: 12.8 },
      { source: 'Affiliate Marketing', amount: 18660, percentage: 3.8, growth: 45.3 }
    ],
    revenueByDestination: [
      { destination: 'Barcelona', revenue: 89340, bookings: 1023, averageValue: 87.35, growth: 28.9 },
      { destination: 'Amsterdam', revenue: 76520, bookings: 834, averageValue: 91.78, growth: 22.1 },
      { destination: 'Rome', revenue: 68900, bookings: 789, averageValue: 87.31, growth: 15.7 },
      { destination: 'Prague', revenue: 52340, bookings: 612, averageValue: 85.52, growth: 35.4 },
      { destination: 'Berlin', revenue: 48760, bookings: 543, averageValue: 89.83, growth: 19.8 }
    ],
    creatorCommissions: {
      total: 67445,
      thisMonth: 12890,
      topEarners: [
        { creator: 'travel_enthusiast', earnings: 4567, bookings: 89 },
        { creator: 'city_explorer', earnings: 3890, bookings: 76 },
        { creator: 'adventure_seeker', earnings: 3245, bookings: 65 },
        { creator: 'foodie_traveler', earnings: 2890, bookings: 58 }
      ]
    }
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMetrics(mockMetrics)
      setIsLoading(false)
    }, 1200)
  }, [selectedPeriod])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 h-96 bg-gray-200"></div>
            <div className="bg-white rounded-xl p-6 h-96 bg-gray-200"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600">Track and analyze your business revenue performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'sources', label: 'Sources' },
              { id: 'destinations', label: 'Destinations' },
              { id: 'creators', label: 'Creators' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id as any)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedView === view.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>

          {/* Export Button */}
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp size={14} className="mr-1" />
              {formatPercentage(metrics!.growthRate)}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics!.totalRevenue)}
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <TrendingUp size={14} className="mr-1" />
              +8.2%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics!.averageOrderValue)}
            </div>
            <p className="text-sm text-gray-600">Average Order Value</p>
            <p className="text-xs text-gray-500 mt-1">per booking</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <TrendingUp size={14} className="mr-1" />
              +2.1%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics!.conversionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-xs text-gray-500 mt-1">visitors to bookings</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <RefreshCw size={20} className="text-orange-600" />
            </div>
            <div className="flex items-center text-sm text-orange-600">
              <TrendingUp size={14} className="mr-1" />
              +12.8%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics!.monthlyRecurring)}
            </div>
            <p className="text-sm text-gray-600">Monthly Revenue</p>
            <p className="text-xs text-gray-500 mt-1">current month</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Details
              </button>
            </div>
            
            {/* Simple chart visualization */}
            <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-end justify-around p-4">
              {metrics!.revenueByMonth.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-8 mb-2"
                    style={{ height: `${(data.revenue / Math.max(...metrics!.revenueByMonth.map(d => d.revenue))) * 150}px` }}
                  ></div>
                  <span className="text-xs text-gray-600 rotate-45 origin-left">
                    {data.month.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {formatCurrency(metrics!.revenueByMonth[metrics!.revenueByMonth.length - 1]?.revenue || 0)}
                </div>
                <div className="text-gray-600">This Month</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">
                  {formatPercentage(metrics!.revenueByMonth[metrics!.revenueByMonth.length - 1]?.growth || 0)}
                </div>
                <div className="text-gray-600">Growth</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {metrics!.revenueByMonth[metrics!.revenueByMonth.length - 1]?.bookings || 0}
                </div>
                <div className="text-gray-600">Bookings</div>
              </div>
            </div>
          </div>

          {/* Revenue Sources */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Sources</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {metrics!.revenueBySource.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{source.source}</span>
                      <span className="text-sm text-gray-600">{source.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${source.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatCurrency(source.amount)}
                      </span>
                      <span className={`text-xs flex items-center ${
                        source.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {source.growth >= 0 ? (
                          <ArrowUpRight size={12} className="mr-1" />
                        ) : (
                          <ArrowDownRight size={12} className="mr-1" />
                        )}
                        {formatPercentage(source.growth)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'destinations' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Destination</h3>
            <div className="flex items-center space-x-2">
              <button className="text-gray-600 hover:text-gray-900 p-2">
                <Filter size={16} />
              </button>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Export Data
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Destination</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Bookings</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Avg. Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Growth</th>
                </tr>
              </thead>
              <tbody>
                {metrics!.revenueByDestination.map((dest, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{dest.destination}</div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-gray-900">
                      {formatCurrency(dest.revenue)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {dest.bookings.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {formatCurrency(dest.averageValue)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`flex items-center justify-end ${
                        dest.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dest.growth >= 0 ? (
                          <TrendingUp size={14} className="mr-1" />
                        ) : (
                          <TrendingDown size={14} className="mr-1" />
                        )}
                        {formatPercentage(dest.growth)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedView === 'creators' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creator Commission Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Creator Commissions</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics!.creatorCommissions.total)}
                </div>
                <p className="text-sm text-gray-600">Total Paid</p>
              </div>
              
              <div>
                <div className="text-xl font-semibold text-green-600">
                  {formatCurrency(metrics!.creatorCommissions.thisMonth)}
                </div>
                <p className="text-sm text-gray-600">This Month</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Average Commission</span>
                  <span className="font-medium">15.2%</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Active Creators</span>
                  <span className="font-medium">247</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Earning Creators */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Earning Creators</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {metrics!.creatorCommissions.topEarners.map((creator, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {creator.creator.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">@{creator.creator}</div>
                      <div className="text-sm text-gray-600">{creator.bookings} bookings generated</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(creator.earnings)}
                    </div>
                    <div className="text-xs text-gray-500">this month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}