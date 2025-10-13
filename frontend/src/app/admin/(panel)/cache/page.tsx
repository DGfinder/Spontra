'use client'

import { useEffect, useState } from 'react'
import { Database, TrendingUp, Clock, DollarSign, Activity, BarChart3, RefreshCw } from 'lucide-react'

interface CacheStats {
  overview: {
    totalEntries: number
    validEntries: number
    staleEntries: number
    expiredEntries: number
    hitRate: string
    costSavings: string
    storageSize: string
  }
  performance: {
    avgOffersPerCache: string
    oldestValidCache: string | null
    newestCache: string | null
    estimatedResponseTime: {
      redis: string
      database: string
      amadeus: string
    }
  }
  recentActivity: Array<{
    source: string
    count: number
  }>
  popularRoutes: Array<{
    origin: string
    destination: string
    requestCount: number
    offerCount: number
    lastCached: string
  }>
  trend: Array<{
    date: string
    total: number
    valid: number
    hitRate: string
  }>
}

export default function CachePerformancePage() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/cache-stats', {
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setStats(data.data)
        setLastRefresh(new Date())
      } else {
        setError(data.error || 'Failed to load cache stats')
      }
    } catch (err) {
      setError('Network error - could not fetch cache stats')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-8">
            <p className="text-white text-center">Loading cache statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-8">
            <p className="text-red-300 text-center">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 mx-auto block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Cache Performance</h1>
            <p className="text-white/70">
              Multi-tier caching dashboard • Last updated:{' '}
              {lastRefresh.toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Cache Hit Rate"
            value={`${stats.overview.hitRate}%`}
            icon={TrendingUp}
            color="green"
            subtitle={`${stats.overview.validEntries.toLocaleString()} valid entries`}
          />
          <MetricCard
            title="Cost Savings"
            value={`$${stats.overview.costSavings}`}
            icon={DollarSign}
            color="blue"
            subtitle="vs. direct API calls"
          />
          <MetricCard
            title="Cache Size"
            value={stats.overview.storageSize}
            icon={Database}
            color="purple"
            subtitle={`${stats.overview.totalEntries.toLocaleString()} total entries`}
          />
          <MetricCard
            title="Avg Offers/Cache"
            value={stats.performance.avgOffersPerCache}
            icon={Activity}
            color="yellow"
            subtitle="per cached query"
          />
        </div>

        {/* Cache Health */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Cache Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-white/60 text-sm mb-2">Valid</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.overview.validEntries.toLocaleString()}
              </p>
              <div className="mt-2 bg-white/10 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      stats.overview.totalEntries > 0
                        ? (stats.overview.validEntries / stats.overview.totalEntries) * 100
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-white/60 text-sm mb-2">Stale</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.overview.staleEntries.toLocaleString()}
              </p>
              <div className="mt-2 bg-white/10 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      stats.overview.totalEntries > 0
                        ? (stats.overview.staleEntries / stats.overview.totalEntries) * 100
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>

            <div>
              <p className="text-white/60 text-sm mb-2">Expired</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.overview.expiredEntries.toLocaleString()}
              </p>
              <div className="mt-2 bg-white/10 rounded-full h-2">
                <div
                  className="bg-red-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      stats.overview.totalEntries > 0
                        ? (stats.overview.expiredEntries / stats.overview.totalEntries) * 100
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Comparison */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Cache Layer Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <p className="text-white font-semibold">Redis/Vercel KV</p>
              </div>
              <p className="text-3xl font-bold text-green-400 mb-1">
                {stats.performance.estimatedResponseTime.redis}
              </p>
              <p className="text-sm text-white/60">Layer 1 - Hot cache</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <p className="text-white font-semibold">Database Cache</p>
              </div>
              <p className="text-3xl font-bold text-blue-400 mb-1">
                {stats.performance.estimatedResponseTime.database}
              </p>
              <p className="text-sm text-white/60">Layer 2 - Persistent cache</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <p className="text-white font-semibold">Amadeus API</p>
              </div>
              <p className="text-3xl font-bold text-red-400 mb-1">
                {stats.performance.estimatedResponseTime.amadeus}
              </p>
              <p className="text-sm text-white/60">Layer 3 - Direct API</p>
            </div>
          </div>
        </div>

        {/* Popular Routes */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Most Cached Routes (Top 10)</h2>
          <div className="space-y-3">
            {stats.popularRoutes.map((route, index) => (
              <div
                key={`${route.origin}-${route.destination}-${index}`}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-200 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">
                      {route.origin} → {route.destination}
                    </h4>
                    <p className="text-sm text-white/60">
                      {route.offerCount} offers • Last cached:{' '}
                      {new Date(route.lastCached).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{route.requestCount}</p>
                  <p className="text-sm text-white/60">cache hits</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hit Rate Trend */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Hit Rate Trend (7 Days)</h2>
          <div className="space-y-2">
            {stats.trend.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <p className="text-white font-medium">{day.date}</p>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-white/60">Total</p>
                    <p className="text-white font-semibold">{day.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60">Valid</p>
                    <p className="text-white font-semibold">{day.valid}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60">Hit Rate</p>
                    <p className="text-green-400 font-bold">{day.hitRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentActivity.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Recent Activity (24 Hours)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.source}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <p className="text-sm text-white/60 mb-1">
                    {activity.source.toUpperCase()}
                  </p>
                  <p className="text-2xl font-bold text-white">{activity.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-200 mb-2">
            💡 Cache Strategy
          </h3>
          <p className="text-blue-100 text-sm">
            Spontra uses a 3-tier caching strategy to optimize performance and reduce
            API costs:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-blue-100">
            <li>
              <strong>Layer 1 (Redis/Vercel KV):</strong> 5-15 minute hot cache for
              ultra-fast responses (~50ms)
            </li>
            <li>
              <strong>Layer 2 (Database):</strong> 30+ minute persistent cache for
              deduplication (~150ms)
            </li>
            <li>
              <strong>Layer 3 (Amadeus API):</strong> Direct API calls when cache misses
              (~2000ms)
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: any
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'red'
  subtitle?: string
}

function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-400 bg-green-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
    red: 'text-red-400 bg-red-500/20'
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-white/70">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
    </div>
  )
}
