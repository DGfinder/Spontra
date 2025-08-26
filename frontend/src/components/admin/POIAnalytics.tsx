'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Users, 
  DollarSign, 
  Star, 
  Target, 
  Clock, 
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Award,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Mountain,
  Compass,
  Coffee,
  TreePine
} from 'lucide-react'
import { 
  PointOfInterest,
  POIAnalytics as POIAnalyticsType,
  ThemeType,
  MonthlyMetric,
  SeasonalTrend,
  PeakTimeInfo
} from '@/types/pois'

interface POIAnalyticsProps {
  destinationId: string
  pois: PointOfInterest[]
  selectedPOI?: PointOfInterest
  onPOISelect?: (poi: PointOfInterest) => void
  className?: string
}

interface AnalyticsTimeRange {
  label: string
  value: '7d' | '30d' | '90d' | '1y'
  days: number
}

const timeRanges: AnalyticsTimeRange[] = [
  { label: '7 days', value: '7d', days: 7 },
  { label: '30 days', value: '30d', days: 30 },
  { label: '90 days', value: '90d', days: 90 },
  { label: '1 year', value: '1y', days: 365 }
]

const themeConfig = {
  vibe: { icon: Zap, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  adventure: { icon: Mountain, color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
  discover: { icon: Compass, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  indulge: { icon: Coffee, color: 'amber', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
  nature: { icon: TreePine, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' }
}

export default function POIAnalytics({ 
  destinationId, 
  pois, 
  selectedPOI, 
  onPOISelect, 
  className = '' 
}: POIAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<AnalyticsTimeRange>(timeRanges[1]) // 30d default
  const [selectedTheme, setSelectedTheme] = useState<ThemeType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'overview' | 'comparison' | 'individual'>('overview')
  const [isLoading, setIsLoading] = useState(false)

  // Calculate aggregated analytics
  const aggregatedAnalytics = useMemo(() => {
    const filteredPOIs = selectedTheme === 'all' 
      ? pois 
      : pois.filter(poi => poi.theme === selectedTheme)

    const totalViews = filteredPOIs.reduce((sum, poi) => sum + (poi.analytics?.totalViews || 0), 0)
    const totalBookings = filteredPOIs.reduce((sum, poi) => sum + (poi.analytics?.bookingsGenerated || 0), 0)
    const totalRevenue = filteredPOIs.reduce((sum, poi) => sum + (poi.analytics?.revenueGenerated || 0), 0)
    const avgRating = filteredPOIs.reduce((sum, poi) => sum + poi.rating, 0) / filteredPOIs.length || 0
    const avgConversionRate = filteredPOIs.reduce((sum, poi) => sum + (poi.analytics?.conversionRate || 0), 0) / filteredPOIs.length || 0

    return {
      totalPOIs: filteredPOIs.length,
      totalViews,
      totalBookings,
      totalRevenue,
      avgRating,
      avgConversionRate,
      topPerforming: filteredPOIs
        .sort((a, b) => (b.analytics?.revenueGenerated || 0) - (a.analytics?.revenueGenerated || 0))
        .slice(0, 5),
      poorPerforming: filteredPOIs
        .filter(poi => (poi.analytics?.conversionRate || 0) < 2)
        .sort((a, b) => (a.analytics?.conversionRate || 0) - (b.analytics?.conversionRate || 0))
        .slice(0, 3)
    }
  }, [pois, selectedTheme])

  // Theme performance comparison
  const themePerformance = useMemo(() => {
    const themes: ThemeType[] = ['vibe', 'adventure', 'discover', 'indulge', 'nature']
    
    return themes.map(theme => {
      const themePOIs = pois.filter(poi => poi.theme === theme)
      const totalViews = themePOIs.reduce((sum, poi) => sum + (poi.analytics?.totalViews || 0), 0)
      const totalRevenue = themePOIs.reduce((sum, poi) => sum + (poi.analytics?.revenueGenerated || 0), 0)
      const avgRating = themePOIs.reduce((sum, poi) => sum + poi.rating, 0) / themePOIs.length || 0
      const avgConversion = themePOIs.reduce((sum, poi) => sum + (poi.analytics?.conversionRate || 0), 0) / themePOIs.length || 0

      return {
        theme,
        count: themePOIs.length,
        totalViews,
        totalRevenue,
        avgRating,
        avgConversion
      }
    }).filter(theme => theme.count > 0)
  }, [pois])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  const getPerformanceColor = (value: number, threshold: { good: number; average: number }) => {
    if (value >= threshold.good) return 'text-green-600 bg-green-100'
    if (value >= threshold.average) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp size={16} className="text-green-500" />
    if (current < previous) return <TrendingDown size={16} className="text-red-500" />
    return <Activity size={16} className="text-gray-500" />
  }

  const PerformanceMetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'blue' 
  }: { 
    title: string
    value: string | number
    icon: any
    trend?: 'up' | 'down' | 'stable'
    trendValue?: string
    color?: string 
  }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp size={14} className="mr-1" />}
              {trend === 'down' && <TrendingDown size={14} className="mr-1" />}
              {trend === 'stable' && <Activity size={14} className="mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const POIRankingCard = ({ poi, rank }: { poi: PointOfInterest; rank: number }) => {
    const theme = themeConfig[poi.theme]
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
            }`}>
              #{rank}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{poi.name}</h4>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${theme.bgColor} ${theme.textColor}`}>
                <theme.icon size={12} className="mr-1" />
                {poi.theme}
              </div>
            </div>
          </div>
          <button
            onClick={() => onPOISelect?.(poi)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            View Details
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Views</p>
            <p className="font-semibold">{(poi.analytics?.totalViews || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Bookings</p>
            <p className="font-semibold">{(poi.analytics?.bookingsGenerated || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Revenue</p>
            <p className="font-semibold">{formatCurrency(poi.analytics?.revenueGenerated || 0)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center">
            <Star size={14} className="text-yellow-400 mr-1" />
            <span className="text-sm font-medium">{poi.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500 ml-1">({poi.reviewCount.toLocaleString()})</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            getPerformanceColor(poi.analytics?.conversionRate || 0, { good: 5, average: 2 })
          }`}>
            {(poi.analytics?.conversionRate || 0).toFixed(1)}% conversion
          </div>
        </div>
      </div>
    )
  }

  const ThemePerformanceCard = ({ themeData }: { themeData: any }) => {
    const theme = themeConfig[themeData.theme as ThemeType]
    
    return (
      <div className={`border rounded-lg p-4 ${theme.bgColor} ${theme.borderColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <theme.icon size={20} className={theme.textColor} />
            <h3 className={`font-medium capitalize ${theme.textColor}`}>{themeData.theme}</h3>
          </div>
          <span className="text-sm text-gray-600">{themeData.count} POIs</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Total Views</p>
            <p className="font-semibold">{themeData.totalViews.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Revenue</p>
            <p className="font-semibold">{formatCurrency(themeData.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-gray-600">Avg Rating</p>
            <div className="flex items-center">
              <Star size={12} className="text-yellow-400 mr-1" />
              <span className="font-semibold">{themeData.avgRating.toFixed(1)}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600">Conversion</p>
            <p className="font-semibold">{themeData.avgConversion.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">POI Analytics</h2>
          <p className="text-gray-600 text-sm">Performance insights and metrics for your points of interest</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  selectedTimeRange.value === range.value
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setIsLoading(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            viewMode === 'overview' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setViewMode('comparison')}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            viewMode === 'comparison' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Theme Comparison
        </button>
        <button
          onClick={() => setViewMode('individual')}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            viewMode === 'individual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Individual POI
        </button>
      </div>

      {/* Theme Filter */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Filter by theme:</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSelectedTheme('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedTheme === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {(Object.keys(themeConfig) as ThemeType[]).map((theme) => {
            const config = themeConfig[theme]
            const themeCount = pois.filter(poi => poi.theme === theme).length
            
            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTheme === theme 
                    ? `bg-${config.color}-600 text-white` 
                    : `${config.bgColor} ${config.textColor} hover:bg-${config.color}-200`
                }`}
              >
                <config.icon size={12} className="mr-1" />
                <span className="capitalize">{theme}</span>
                <span className="ml-1 opacity-75">({themeCount})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PerformanceMetricCard
              title="Total Views"
              value={aggregatedAnalytics.totalViews.toLocaleString()}
              icon={Eye}
              trend="up"
              trendValue="+12.5% vs last period"
              color="blue"
            />
            <PerformanceMetricCard
              title="Total Bookings"
              value={aggregatedAnalytics.totalBookings.toLocaleString()}
              icon={Target}
              trend="up"
              trendValue="+8.2% vs last period"
              color="green"
            />
            <PerformanceMetricCard
              title="Revenue Generated"
              value={formatCurrency(aggregatedAnalytics.totalRevenue)}
              icon={DollarSign}
              trend="up"
              trendValue="+15.7% vs last period"
              color="yellow"
            />
            <PerformanceMetricCard
              title="Avg Conversion"
              value={`${aggregatedAnalytics.avgConversionRate.toFixed(1)}%`}
              icon={TrendingUp}
              trend="stable"
              trendValue="±0.3% vs last period"
              color="purple"
            />
          </div>

          {/* Top & Poor Performing POIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing POIs</h3>
                <Award size={20} className="text-yellow-500" />
              </div>
              <div className="space-y-3">
                {aggregatedAnalytics.topPerforming.map((poi, index) => (
                  <POIRankingCard key={poi.id} poi={poi} rank={index + 1} />
                ))}
              </div>
            </div>

            {/* Poor Performing */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
                <AlertTriangle size={20} className="text-orange-500" />
              </div>
              <div className="space-y-3">
                {aggregatedAnalytics.poorPerforming.length > 0 ? (
                  aggregatedAnalytics.poorPerforming.map((poi) => (
                    <div key={poi.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{poi.name}</h4>
                          <p className="text-sm text-orange-600">Low conversion rate: {(poi.analytics?.conversionRate || 0).toFixed(1)}%</p>
                        </div>
                        <button
                          onClick={() => onPOISelect?.(poi)}
                          className="text-orange-600 hover:text-orange-700 text-sm"
                        >
                          Optimize
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">All POIs performing well!</p>
                    <p className="text-green-600 text-sm">No POIs need immediate attention.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'comparison' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Theme Performance Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themePerformance.map((themeData) => (
              <ThemePerformanceCard key={themeData.theme} themeData={themeData} />
            ))}
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Theme Performance Trends</h4>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Interactive performance chart would be rendered here</p>
                <p className="text-sm text-gray-500">Showing theme comparison over {selectedTimeRange.label.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'individual' && selectedPOI && selectedPOI.analytics && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedPOI.name}</h3>
              <p className="text-gray-600 text-sm">Detailed analytics and insights</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              themeConfig[selectedPOI.theme].bgColor
            } ${themeConfig[selectedPOI.theme].textColor}`}>
              {selectedPOI.theme}
            </div>
          </div>

          {/* Individual POI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <PerformanceMetricCard
              title="Total Views"
              value={selectedPOI.analytics.totalViews.toLocaleString()}
              icon={Eye}
              color="blue"
            />
            <PerformanceMetricCard
              title="Bookings"
              value={selectedPOI.analytics.bookingsGenerated.toLocaleString()}
              icon={Target}
              color="green"
            />
            <PerformanceMetricCard
              title="Revenue"
              value={formatCurrency(selectedPOI.analytics.revenueGenerated)}
              icon={DollarSign}
              color="yellow"
            />
            <PerformanceMetricCard
              title="Conversion Rate"
              value={`${selectedPOI.analytics.conversionRate.toFixed(1)}%`}
              icon={TrendingUp}
              color="purple"
            />
            <PerformanceMetricCard
              title="Avg Time Spent"
              value={`${Math.floor(selectedPOI.analytics.timeSpentViewing / 60)}m ${selectedPOI.analytics.timeSpentViewing % 60}s`}
              icon={Clock}
              color="indigo"
            />
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Rating Distribution</h4>
              <div className="space-y-2">
                {Object.entries(selectedPOI.analytics.ratingDistribution).reverse().map(([rating, count]) => {
                  const percentage = (count / selectedPOI.analytics!.totalReviews) * 100
                  return (
                    <div key={rating} className="flex items-center">
                      <span className="w-12 text-sm text-gray-600">{rating} stars</span>
                      <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-16 text-sm text-gray-900 text-right">{count.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Performance Insights</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getPerformanceColor(selectedPOI.analytics.qualityScore, { good: 8, average: 6 })
                  }`}>
                    {selectedPOI.analytics.qualityScore.toFixed(1)}/10
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trending Score</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getPerformanceColor(selectedPOI.analytics.trendingScore, { good: 7, average: 5 })
                  }`}>
                    {selectedPOI.analytics.trendingScore.toFixed(1)}/10
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Content Completeness</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getPerformanceColor(selectedPOI.analytics.contentCompleteness, { good: 80, average: 60 })
                  }`}>
                    {selectedPOI.analytics.contentCompleteness}%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category Rank</span>
                  <span className="text-sm font-medium text-gray-900">
                    #{selectedPOI.analytics.rankInCategory}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}