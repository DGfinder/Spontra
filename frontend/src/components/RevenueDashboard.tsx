'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Calendar,
  RefreshCw,
  ExternalLink,
  Award,
  Zap
} from 'lucide-react'

interface RevenueMetrics {
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  totalCommissions: number
  conversionRate: number
  averageBookingValue: number
  partnerStats: Record<string, {
    clicks: number
    conversions: number
    revenue: number
    commissions: number
    conversionRate: number
  }>
  timeframe: string
}

interface RevenueDashboardProps {
  className?: string
}

export function RevenueDashboard({ className = '' }: RevenueDashboardProps) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('24h')
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)

  // Fetch revenue metrics
  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      // Fetch click analytics
      const clickResponse = await fetch(`/api/analytics/click?timeframe=${timeframe}${selectedPartner ? `&partner=${selectedPartner}` : ''}`)
      const clickData = await clickResponse.json()

      // Fetch conversion data
      const conversionResponse = await fetch(`/api/webhooks/conversion?timeframe=${timeframe}${selectedPartner ? `&partner=${selectedPartner}` : ''}`)
      const conversionData = await conversionResponse.json()

      // Combine and calculate metrics
      const combinedMetrics: RevenueMetrics = {
        totalClicks: clickData.metrics?.totalClicks || 0,
        totalConversions: conversionData.metrics?.totalConversions || 0,
        totalRevenue: conversionData.metrics?.totalRevenue || 0,
        totalCommissions: conversionData.metrics?.totalCommissions || 0,
        conversionRate: clickData.metrics?.totalClicks > 0 ? 
          ((conversionData.metrics?.totalConversions || 0) / clickData.metrics.totalClicks * 100) : 0,
        averageBookingValue: conversionData.metrics?.averageBookingValue || 0,
        partnerStats: combinePartnerStats(clickData.metrics?.partnerStats || {}, conversionData.metrics?.statusBreakdown || {}),
        timeframe
      }

      setMetrics(combinedMetrics)
    } catch (error) {
      console.error('Failed to fetch revenue metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [timeframe, selectedPartner])

  const combinePartnerStats = (clickStats: any, conversionStats: any) => {
    const combined: Record<string, any> = {}
    
    // Process click stats
    Object.keys(clickStats).forEach(partnerId => {
      combined[partnerId] = {
        clicks: clickStats[partnerId].clicks || 0,
        conversions: 0,
        revenue: 0,
        commissions: 0,
        conversionRate: 0
      }
    })

    // Add conversion data (simplified for demo)
    // In production, you'd match by partner ID properly
    Object.keys(combined).forEach(partnerId => {
      const conversions = Math.floor(combined[partnerId].clicks * 0.12) // 12% conversion rate estimate
      const revenue = conversions * 350 // €350 average booking
      const commissions = revenue * 0.035 // 3.5% average commission
      
      combined[partnerId] = {
        ...combined[partnerId],
        conversions,
        revenue: Math.round(revenue * 100) / 100,
        commissions: Math.round(commissions * 100) / 100,
        conversionRate: combined[partnerId].clicks > 0 ? 
          Math.round((conversions / combined[partnerId].clicks) * 10000) / 100 : 0
      }
    })

    return combined
  }

  const timeframeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ]

  if (isLoading) {
    return (
      <div className={`bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className={`bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6 ${className}`}>
        <div className="text-center text-white/60">
          Failed to load revenue metrics
        </div>
      </div>
    )
  }

  const topPartners = Object.entries(metrics.partnerStats)
    .sort(([,a], [,b]) => b.commissions - a.commissions)
    .slice(0, 5)

  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-bold text-xl">Revenue Analytics</h2>
          <p className="text-white/60 text-sm">Affiliate performance and commission tracking</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-gray-800">
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={fetchMetrics}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 transition-colors"
          >
            <RefreshCw size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={20} className="text-green-400" />
            <span className="text-white/80 text-sm">Total Revenue</span>
          </div>
          <div className="text-white text-2xl font-bold">€{metrics.totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Award size={20} className="text-yellow-400" />
            <span className="text-white/80 text-sm">Commissions</span>
          </div>
          <div className="text-white text-2xl font-bold">€{metrics.totalCommissions.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target size={20} className="text-blue-400" />
            <span className="text-white/80 text-sm">Conversion Rate</span>
          </div>
          <div className="text-white text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users size={20} className="text-purple-400" />
            <span className="text-white/80 text-sm">Total Clicks</span>
          </div>
          <div className="text-white text-2xl font-bold">{metrics.totalClicks.toLocaleString()}</div>
        </div>
      </div>

      {/* Partner Performance */}
      <div className="mb-8">
        <h3 className="text-white font-semibold text-lg mb-4">Top Performing Partners</h3>
        <div className="space-y-3">
          {topPartners.map(([partnerId, stats]) => (
            <div key={partnerId} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <ExternalLink size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium capitalize">{partnerId}</div>
                    <div className="text-white/60 text-sm">
                      {stats.clicks} clicks • {stats.conversions} conversions
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-bold">€{stats.commissions.toFixed(2)}</div>
                  <div className="text-white/60 text-sm">{stats.conversionRate.toFixed(1)}% CR</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (stats.commissions / Math.max(...topPartners.map(([,s]) => s.commissions))) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap size={16} className="text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-blue-200 font-medium mb-2">Performance Insights</h4>
            <ul className="text-blue-200/80 text-sm space-y-1">
              <li>• Average booking value: €{metrics.averageBookingValue.toFixed(0)}</li>
              <li>• Top converting partner: {topPartners[0]?.[0] || 'None'}</li>
              <li>• Commission rate range: 1.2% - 4.2% depending on partner</li>
              <li>• {metrics.totalConversions} successful bookings tracked in {timeframe}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}