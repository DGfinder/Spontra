'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  CreditCard, 
  Search,
  DollarSign,
  Percent,
  MapPin,
  RefreshCw,
  Calendar
} from 'lucide-react'

interface Analytics {
  period: string
  metrics: {
    totalUsers: number
    newUsers: number
    totalSearches: number
    totalClicks: number
    totalConversions: number
    conversionRate: string
    totalRevenue: string
    epc: string
  }
  topDestinations: Array<{ code: string; clicks: number }>
  generatedAt: string
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      const data = await res.json()
      if (data.ok) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const periodOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
  ] as const

  const metrics = analytics?.metrics || {
    totalUsers: 0,
    newUsers: 0,
    totalSearches: 0,
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: '0.00%',
    totalRevenue: '0.00',
    epc: '0.00',
  }

  const metricCards = [
    { 
      label: 'Total Users', 
      value: metrics.totalUsers.toLocaleString(), 
      icon: Users,
      color: 'blue',
      subtext: `+${metrics.newUsers} new`
    },
    { 
      label: 'Searches', 
      value: metrics.totalSearches.toLocaleString(), 
      icon: Search,
      color: 'purple',
    },
    { 
      label: 'Clicks', 
      value: metrics.totalClicks.toLocaleString(), 
      icon: MousePointer,
      color: 'amber',
    },
    { 
      label: 'Conversions', 
      value: metrics.totalConversions.toLocaleString(), 
      icon: CreditCard,
      color: 'emerald',
    },
    { 
      label: 'Conversion Rate', 
      value: metrics.conversionRate, 
      icon: Percent,
      color: 'pink',
    },
    { 
      label: 'Revenue', 
      value: `€${metrics.totalRevenue}`, 
      icon: DollarSign,
      color: 'green',
    },
    { 
      label: 'EPC', 
      value: `€${metrics.epc}`, 
      icon: TrendingUp,
      color: 'indigo',
      subtext: 'Earnings per click'
    },
  ]

  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    pink: { bg: 'bg-pink-50', icon: 'text-pink-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-600">
            Platform performance and revenue metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {periodOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === value
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(({ label, value, icon: Icon, color, subtext }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {loading ? '--' : value}
                </p>
                {subtext && (
                  <p className="mt-1 text-xs text-slate-500">{subtext}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${colorClasses[color]?.bg || 'bg-slate-50'}`}>
                <Icon className={`h-5 w-5 ${colorClasses[color]?.icon || 'text-slate-600'}`} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Top Destinations */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Top Destinations</h2>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : analytics?.topDestinations.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No destination data for this period
          </div>
        ) : (
          <div className="space-y-3">
            {analytics?.topDestinations.map((dest, i) => (
              <div key={dest.code} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-900">{dest.code}</span>
                </div>
                <span className="text-sm text-slate-600">{dest.clicks.toLocaleString()} clicks</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Last Updated */}
      {analytics?.generatedAt && (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Last updated: {new Date(analytics.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
