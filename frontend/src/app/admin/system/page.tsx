'use client'

import { useState, useEffect } from 'react'
import { 
  Activity,
  Server,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Cpu,
  Database as HardDisk,
  Database as Memory,
  Zap,
  Users,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react'

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'unknown'
  services: Array<{
    name: string
    status: 'up' | 'degraded' | 'down' | 'unknown'
    responseTime: number | null
    uptime: number | null
    version: string | null
    endpoints: Array<{
      path: string
      method: string
      status: number | null
      responseTime: number | null
      lastChecked: string | null
    }>
  }>
  performance: {
    cpu: number | null
    memory: number | null
    disk: number | null
    database: {
      connections: number | null
      queryTime: number | null
      errorRate: number | null
    }
    cache: {
      hitRate: number | null
      memoryUsage: number | null
    }
    api: {
      requestsPerSecond: number | null
      averageResponseTime: number | null
      errorRate: number | null
    }
  }
  alerts: Array<{
    id: string
    level: 'info' | 'warning' | 'error' | 'critical'
    message: string
    service: string
    timestamp: string
    acknowledged: boolean
  }>
  lastUpdated: string
  monitoringEnabled: boolean
}

interface SystemMetrics {
  realTimeStats: {
    requestsPerSecond: number | null
    activeUsers: number | null
    responseTime: number | null
    errorRate: number | null
  }
  resourceUsage: {
    cpu: number | null
    memory: number | null
    disk: number | null
    network: number | null
  }
  recentAlerts: Array<{
    id: string
    level: 'info' | 'warning' | 'error' | 'critical'
    message: string
    service: string
    timestamp: string
  }>
}

export default function SystemMonitor() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [monitoringEnabled, setMonitoringEnabled] = useState(false)


  useEffect(() => {
    loadSystemData()

    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout
    if (autoRefresh && monitoringEnabled) {
      interval = setInterval(loadSystemData, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, monitoringEnabled])

  const loadSystemData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if monitoring is enabled first
      const monitoringResponse = await fetch('/api/admin/system/status')
      const monitoringData = await monitoringResponse.json()
      
      setMonitoringEnabled(monitoringData.enabled || false)

      if (!monitoringData.enabled) {
        // Set empty/zero values when monitoring is disabled
        setSystemHealth({
          overall: 'unknown',
          services: [],
          performance: {
            cpu: null,
            memory: null,
            disk: null,
            database: {
              connections: null,
              queryTime: null,
              errorRate: null
            },
            cache: {
              hitRate: null,
              memoryUsage: null
            },
            api: {
              requestsPerSecond: null,
              averageResponseTime: null,
              errorRate: null
            }
          },
          alerts: [],
          lastUpdated: new Date().toISOString(),
          monitoringEnabled: false
        })
        
        setSystemMetrics({
          realTimeStats: {
            requestsPerSecond: null,
            activeUsers: null,
            responseTime: null,
            errorRate: null
          },
          resourceUsage: {
            cpu: null,
            memory: null,
            disk: null,
            network: null
          },
          recentAlerts: []
        })
      } else {
        // Load real system data when monitoring is enabled
        const [healthResponse, metricsResponse] = await Promise.all([
          fetch('/api/admin/system/health'),
          fetch('/api/admin/system/metrics')
        ])

        if (healthResponse.ok && metricsResponse.ok) {
          const healthData = await healthResponse.json()
          const metricsData = await metricsResponse.json()
          
          setSystemHealth(healthData)
          setSystemMetrics(metricsData)
        } else {
          throw new Error('Failed to load system data')
        }
      }
      
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load system monitoring data'
      setError(errorMessage)
      console.error('System monitoring error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle size={16} />
      case 'error': return <XCircle size={16} />
      case 'warning': return <AlertTriangle size={16} />
      case 'info': return <CheckCircle size={16} />
      default: return <Activity size={16} />
    }
  }

  const getResourceColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500'
    if (usage >= 75) return 'bg-yellow-500'
    if (usage >= 50) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const handleRefresh = () => {
    loadSystemData()
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitor</h1>
          <p className="text-gray-600">Real-time system health and performance monitoring</p>
          <MonitoringStatusIndicator enabled={monitoringEnabled} />
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Wifi size={16} className="mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {!monitoringEnabled ? (
        <EmptyMonitoringState />
      ) : (
        <>
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity size={20} className="text-blue-600" />
            </div>
            <div className={`text-sm flex items-center ${
              systemHealth!.overall === 'healthy' ? 'text-green-600' : 
              systemHealth!.overall === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {systemHealth?.overall === 'healthy' ? <CheckCircle size={14} className="mr-1" /> : 
               systemHealth?.overall === 'warning' ? <AlertTriangle size={14} className="mr-1" /> : 
               <XCircle size={14} className="mr-1" />}
              {systemHealth?.overall ?? 'unknown'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemHealth ? `${systemHealth.services.filter(s => s.status === 'up').length}/${systemHealth.services.length}` : '0/0'}
            </div>
            <p className="text-sm text-gray-600">Services Online</p>
            <p className="text-xs text-gray-500 mt-1">system health</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +12%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemMetrics?.realTimeStats.requestsPerSecond ?? '0'}
            </div>
            <p className="text-sm text-gray-600">Requests/sec</p>
            <p className="text-xs text-gray-500 mt-1">current load</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
            <div className="text-sm text-purple-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +8%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemMetrics?.realTimeStats.activeUsers?.toLocaleString() ?? '0'}
            </div>
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-xs text-gray-500 mt-1">online now</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div className="text-sm text-yellow-600 flex items-center">
              <Clock size={14} className="mr-1" />
              avg
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemMetrics?.realTimeStats.responseTime ?? '0'}ms
            </div>
            <p className="text-sm text-gray-600">Response Time</p>
            <p className="text-xs text-gray-500 mt-1">average response</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Status */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Service Status</h3>
              <p className="text-sm text-gray-600">Current status of all system services</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {systemHealth?.services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {service.name.includes('Database') ? <Database size={16} /> :
                           service.name.includes('API') ? <Server size={16} /> :
                           service.name.includes('Frontend') ? <Globe size={16} /> :
                           service.name.includes('Cache') ? <Zap size={16} /> :
                           <Activity size={16} />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600">v{service.version}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right text-sm">
                          <div className="text-gray-900">{service.responseTime}ms</div>
                          <div className="text-gray-500">response</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-900">{service.uptime}%</div>
                          <div className="text-gray-500">uptime</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getServiceStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Endpoints */}
                    <div className="space-y-2">
                      {service.endpoints.map((endpoint, endpointIndex) => (
                        <div key={endpointIndex} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              endpoint.status === 200 ? 'bg-green-100 text-green-700' :
                              endpoint.status >= 400 ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {endpoint.status}
                            </span>
                            <span className="text-gray-600">{endpoint.method}</span>
                            <span className="font-medium">{endpoint.path}</span>
                          </div>
                          <span className="text-gray-500">{endpoint.responseTime}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resource Usage & Alerts */}
        <div className="space-y-6">
          {/* Resource Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Resource Usage</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Cpu size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">CPU</span>
                  </div>
                  <span className="text-sm text-gray-600">{systemMetrics?.resourceUsage.cpu ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics?.resourceUsage.cpu ?? 0)}`}
                    style={{ width: `${systemMetrics?.resourceUsage.cpu ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Memory size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Memory</span>
                  </div>
                  <span className="text-sm text-gray-600">{systemMetrics?.resourceUsage.memory ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics?.resourceUsage.memory ?? 0)}`}
                    style={{ width: `${systemMetrics?.resourceUsage.memory ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <HardDisk size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Disk</span>
                  </div>
                  <span className="text-sm text-gray-600">{systemMetrics?.resourceUsage.disk ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics?.resourceUsage.disk ?? 0)}`}
                    style={{ width: `${systemMetrics?.resourceUsage.disk ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Wifi size={16} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">Network</span>
                  </div>
                  <span className="text-sm text-gray-600">{systemMetrics?.resourceUsage.network ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics?.resourceUsage.network ?? 0)}`}
                    style={{ width: `${systemMetrics?.resourceUsage.network ?? 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            </div>
            
            <div className="p-6">
              {systemHealth?.alerts && systemHealth.alerts.length > 0 ? (
                <div className="space-y-3">
                  {systemHealth.alerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.level)}`}>
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.level)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">{alert.service}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield size={48} className="mx-auto text-green-500 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h4>
                  <p className="text-gray-600">No recent alerts or issues detected.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

function MonitoringStatusIndicator({ enabled }: { enabled: boolean }) {
  const StatusIcon = enabled ? Wifi : WifiOff
  const color = enabled ? 'text-green-600' : 'text-red-600'
  const text = enabled ? 'Monitoring Active' : 'Monitoring Disabled'

  return (
    <div className="flex items-center space-x-2 mt-1">
      <StatusIcon size={14} className={color} />
      <span className={`text-sm ${color}`}>{text}</span>
      {!enabled && (
        <span className="text-xs text-gray-500">• Configure system monitoring</span>
      )}
    </div>
  )
}

function EmptyMonitoringState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Activity size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        System Monitoring Not Configured
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To monitor system health and performance, configure monitoring tools and health checks.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Setup Requirements:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Server size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Health Check Endpoints</div>
              <div className="text-sm text-gray-600">Configure /health endpoints for all services</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Activity size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Performance Monitoring</div>
              <div className="text-sm text-gray-600">Set up Prometheus, New Relic, or DataDog</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Database size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Database Monitoring</div>
              <div className="text-sm text-gray-600">Configure database connection and query monitoring</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={12} className="text-orange-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Alerting System</div>
              <div className="text-sm text-gray-600">Configure alerts for system issues and thresholds</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure monitoring tools and health checks.
          </div>
        </div>
      </div>
    </div>
  )
}