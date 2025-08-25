'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Clock,
  Cpu,
  Database,
  Globe,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Zap,
  Users,
  Server,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react'

interface PerformanceMetrics {
  overview: {
    averageResponseTime: number | null
    requestsPerSecond: number | null
    errorRate: number | null
    uptime: number | null
  }
  resources: {
    cpu: {
      current: number | null
      average: number | null
      peak: number | null
    }
    memory: {
      current: number | null
      average: number | null
      peak: number | null
      total: number | null
    }
    disk: {
      usage: number | null
      available: number | null
      total: number | null
    }
    network: {
      inbound: number | null
      outbound: number | null
    }
  }
  services: Array<{
    name: string
    responseTime: number | null
    throughput: number | null
    errorRate: number | null
    status: 'healthy' | 'degraded' | 'down' | 'unknown'
  }>
  trends: Array<{
    timestamp: string
    responseTime: number | null
    requestsPerSecond: number | null
    errorRate: number | null
  }>
  monitoringEnabled: boolean
}

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadPerformanceData()

    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadPerformanceData, 60000) // 1 minute
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeRange, autoRefresh])

  const loadPerformanceData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/system/performance?timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to load performance data')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load performance metrics'
      setError(errorMessage)
      console.error('Performance metrics error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(1)
  }

  const formatBytes = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getResourceColor = (usage: number | null) => {
    if (usage === null) return 'bg-gray-300'
    if (usage >= 90) return 'bg-red-500'
    if (usage >= 75) return 'bg-yellow-500'
    if (usage >= 50) return 'bg-blue-500'
    return 'bg-green-500'
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
        </div>
      </div>
    )
  }

  if (!metrics?.monitoringEnabled) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Metrics</h1>
            <p className="text-gray-600">System performance monitoring and analytics</p>
            <div className="flex items-center space-x-2 mt-1">
              <WifiOff size={14} className="text-red-600" />
              <span className="text-sm text-red-600">Performance Monitoring Disabled</span>
              <span className="text-xs text-gray-500">• Configure monitoring tools</span>
            </div>
          </div>
        </div>

        <EmptyPerformanceState />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-600">System performance monitoring and analytics</p>
          <div className="flex items-center space-x-2 mt-1">
            <Wifi size={14} className="text-green-600" />
            <span className="text-sm text-green-600">Monitoring Active</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw size={16} className="mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={loadPerformanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div className="text-sm text-blue-600">avg</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.overview.averageResponseTime || 0}ms
            </div>
            <p className="text-sm text-gray-600">Response Time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="text-sm text-green-600">req/s</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(metrics.overview.requestsPerSecond)}
            </div>
            <p className="text-sm text-gray-600">Requests/sec</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="text-sm text-red-600">errors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(metrics.overview.errorRate || 0).toFixed(2)}%
            </div>
            <p className="text-sm text-gray-600">Error Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity size={20} className="text-purple-600" />
            </div>
            <div className="text-sm text-purple-600">uptime</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(metrics.overview.uptime || 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">System Uptime</p>
          </div>
        </div>
      </div>

      {/* Resource Usage & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Resource Usage</h3>
            <p className="text-sm text-gray-600">Current system resource utilization</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Cpu size={16} className="text-blue-600" />
                  <span className="font-medium text-gray-900">CPU Usage</span>
                </div>
                <span className="text-sm text-gray-600">{metrics.resources.cpu.current || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getResourceColor(metrics.resources.cpu.current)}`}
                  style={{ width: `${metrics.resources.cpu.current || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Avg: {metrics.resources.cpu.average || 0}%</span>
                <span>Peak: {metrics.resources.cpu.peak || 0}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Database size={16} className="text-green-600" />
                  <span className="font-medium text-gray-900">Memory Usage</span>
                </div>
                <span className="text-sm text-gray-600">{metrics.resources.memory.current || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getResourceColor(metrics.resources.memory.current)}`}
                  style={{ width: `${metrics.resources.memory.current || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Used: {formatBytes(metrics.resources.memory.total ? (metrics.resources.memory.total * (metrics.resources.memory.current || 0)) / 100 : null)}</span>
                <span>Total: {formatBytes(metrics.resources.memory.total)}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Server size={16} className="text-purple-600" />
                  <span className="font-medium text-gray-900">Disk Usage</span>
                </div>
                <span className="text-sm text-gray-600">{metrics.resources.disk.usage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getResourceColor(metrics.resources.disk.usage)}`}
                  style={{ width: `${metrics.resources.disk.usage || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Available: {formatBytes(metrics.resources.disk.available)}</span>
                <span>Total: {formatBytes(metrics.resources.disk.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Service Performance</h3>
            <p className="text-sm text-gray-600">Individual service metrics</p>
          </div>
          
          <div className="p-6">
            {metrics.services.length > 0 ? (
              <div className="space-y-4">
                {metrics.services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Response Time</div>
                        <div className="font-medium">{service.responseTime || 0}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Throughput</div>
                        <div className="font-medium">{formatNumber(service.throughput)} req/s</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Error Rate</div>
                        <div className="font-medium">{(service.errorRate || 0).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe size={32} className="mx-auto mb-2 text-gray-400" />
                <p>No service data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyPerformanceState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <BarChart3 size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Performance Monitoring Not Configured
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To monitor system performance metrics, configure performance monitoring tools.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Setup:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Application Performance Monitoring</div>
              <div className="text-sm text-gray-600">New Relic, DataDog, or Dynatrace integration</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Server size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Infrastructure Monitoring</div>
              <div className="text-sm text-gray-600">Server metrics collection and analysis</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Activity size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Custom Metrics</div>
              <div className="text-sm text-gray-600">Business and application-specific metrics</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure performance monitoring.
          </div>
        </div>
      </div>
    </div>
  )
}