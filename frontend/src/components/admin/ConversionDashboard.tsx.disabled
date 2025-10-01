'use client'

import { useState, useEffect } from 'react'
import { BarChart, TrendingUp, DollarSign, MousePointer, Users, ExternalLink } from 'lucide-react'

interface ConversionMetrics {
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  totalCommissions: number
  averageBookingValue: number
  conversionRate: number
  partnerStats: Record<string, {
    clicks: number
    totalValue: number
    averageValue: number
  }>
  deviceStats: Record<string, number>
  topPartner: string
}

interface ConversionEvent {
  clickId: string
  bookingReference: string
  bookingValue: number
  currency: string
  commissionValue: number
  bookingDate: string
  flightDetails: {
    origin: string
    destination: string
    departureDate: string
    airline: string
  }
  status: string
}

export function ConversionDashboard() {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null)
  const [conversions, setConversions] = useState<ConversionEvent[]>([])
  const [timeframe, setTimeframe] = useState('24h')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch click metrics
      const clickResponse = await fetch(`/api/analytics/click?timeframe=${timeframe}`)
      const clickData = await clickResponse.json()
      
      // Fetch conversion metrics
      const conversionResponse = await fetch(`/api/webhooks/conversion?timeframe=${timeframe}`)
      const conversionData = await conversionResponse.json()
      
      if (clickData.success && conversionData.success) {
        const combinedMetrics: ConversionMetrics = {
          ...clickData.metrics,
          totalConversions: conversionData.metrics.totalConversions,
          totalRevenue: conversionData.metrics.totalRevenue,
          totalCommissions: conversionData.metrics.totalCommissions,
          conversionRate: clickData.metrics.totalClicks > 0 
            ? (conversionData.metrics.totalConversions / clickData.metrics.totalClicks) * 100 
            : 0
        }
        
        setMetrics(combinedMetrics)
        setConversions(conversionData.conversions || [])
      } else {
        setError('Failed to fetch analytics data')
      }
    } catch (err) {
      setError('Error loading analytics data')
      console.error('Analytics fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeframe])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <BarChart className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Conversion Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg border p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Conversion Analytics</h2>
        </div>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center space-x-3">
            <MousePointer className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold">{metrics.totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-2xl font-bold">{metrics.totalConversions.toLocaleString()}</p>
              <p className="text-xs text-green-600">{metrics.conversionRate.toFixed(2)}% rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Avg ${metrics.averageBookingValue.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Commissions</p>
              <p className="text-2xl font-bold">${metrics.totalCommissions.toLocaleString()}</p>
              <p className="text-xs text-purple-600">
                {metrics.totalRevenue > 0 ? ((metrics.totalCommissions / metrics.totalRevenue) * 100).toFixed(1) : 0}% rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Partner Performance</h3>
          <div className="space-y-3">
            {Object.entries(metrics.partnerStats)
              .sort(([,a], [,b]) => b.clicks - a.clicks)
              .slice(0, 5)
              .map(([partner, stats]) => (
                <div key={partner} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{partner}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{stats.clicks} clicks</div>
                    <div className="text-xs text-gray-500">${stats.averageValue.toFixed(0)} avg</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(metrics.deviceStats)
              .sort(([,a], [,b]) => b - a)
              .map(([device, clicks]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium capitalize">{device}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{clicks} clicks</div>
                    <div className="text-xs text-gray-500">
                      {metrics.totalClicks > 0 ? ((clicks / metrics.totalClicks) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Conversions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conversions.slice(0, 10).map((conversion) => (
                <tr key={conversion.clickId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {conversion.bookingReference}
                    </div>
                    <div className="text-sm text-gray-500">{conversion.clickId.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {conversion.flightDetails.origin} → {conversion.flightDetails.destination}
                    </div>
                    <div className="text-sm text-gray-500">{conversion.flightDetails.airline}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {conversion.currency}{conversion.bookingValue}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {conversion.currency}{conversion.commissionValue}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(conversion.bookingDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}