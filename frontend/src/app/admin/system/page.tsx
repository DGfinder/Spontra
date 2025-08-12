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
  Wifi
} from 'lucide-react'
import { SystemHealth } from '@/types/admin'

interface SystemMetrics {
  realTimeStats: {
    requestsPerSecond: number
    activeUsers: number
    responseTime: number
    errorRate: number
  }
  resourceUsage: {
    cpu: number
    memory: number
    disk: number
    network: number
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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock data
  const mockSystemHealth: SystemHealth = {
    overall: 'healthy',
    services: [
      {
        name: 'Frontend (Next.js)',
        status: 'up',
        responseTime: 89,
        uptime: 99.9,
        version: '1.2.3',
        endpoints: [
          { path: '/', method: 'GET', status: 200, responseTime: 89, lastChecked: new Date().toISOString() },
          { path: '/api/health', method: 'GET', status: 200, responseTime: 45, lastChecked: new Date().toISOString() }
        ]
      },
      {
        name: 'Backend API (Go)',
        status: 'up',
        responseTime: 156,
        uptime: 99.8,
        version: '2.1.0',
        endpoints: [
          { path: '/health', method: 'GET', status: 200, responseTime: 156, lastChecked: new Date().toISOString() },
          { path: '/api/v1/cities', method: 'GET', status: 200, responseTime: 234, lastChecked: new Date().toISOString() },
          { path: '/api/v1/flights', method: 'GET', status: 200, responseTime: 189, lastChecked: new Date().toISOString() }
        ]
      },
      {
        name: 'Admin API',
        status: 'up',
        responseTime: 134,
        uptime: 99.5,
        version: '1.0.5',
        endpoints: [
          { path: '/admin/health', method: 'GET', status: 200, responseTime: 134, lastChecked: new Date().toISOString() },
          { path: '/admin/metrics', method: 'GET', status: 200, responseTime: 167, lastChecked: new Date().toISOString() }
        ]
      },
      {
        name: 'PostgreSQL Database',
        status: 'up',
        responseTime: 45,
        uptime: 99.9,
        version: '14.2',
        endpoints: [
          { path: 'connection_pool', method: 'CHECK', status: 200, responseTime: 45, lastChecked: new Date().toISOString() }
        ]
      },
      {
        name: 'Redis Cache',
        status: 'up',
        responseTime: 12,
        uptime: 100,
        version: '7.0',
        endpoints: [
          { path: 'ping', method: 'PING', status: 200, responseTime: 12, lastChecked: new Date().toISOString() }
        ]
      },
      {
        name: 'Amadeus API',
        status: 'degraded',
        responseTime: 1890,
        uptime: 98.2,
        version: 'v2',
        endpoints: [
          { path: '/v2/shopping/flight-offers', method: 'GET', status: 200, responseTime: 1890, lastChecked: new Date().toISOString() },
          { path: '/v1/reference-data/locations/cities', method: 'GET', status: 429, responseTime: 2100, lastChecked: new Date().toISOString() }
        ]
      }
    ],
    performance: {
      cpu: 45,
      memory: 67,
      disk: 23,
      database: {
        connections: 15,
        queryTime: 25,
        errorRate: 0.1
      },
      cache: {
        hitRate: 89,
        memoryUsage: 45
      },
      api: {
        requestsPerSecond: 120,
        averageResponseTime: 89,
        errorRate: 0.2
      }
    },
    alerts: [
      {
        id: 'alert_001',
        level: 'warning',
        message: 'Amadeus API response time above threshold (1.8s)',
        service: 'Amadeus API',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        acknowledged: false
      },
      {
        id: 'alert_002',
        level: 'info',
        message: 'Scheduled backup completed successfully',
        service: 'Database',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        acknowledged: true
      }
    ],
    lastUpdated: new Date().toISOString()
  }

  const mockSystemMetrics: SystemMetrics = {
    realTimeStats: {
      requestsPerSecond: 120,
      activeUsers: 2340,
      responseTime: 156,
      errorRate: 0.12
    },
    resourceUsage: {
      cpu: 45,
      memory: 67,
      disk: 23,
      network: 34
    },
    recentAlerts: mockSystemHealth.alerts
  }

  useEffect(() => {
    const loadData = () => {
      setTimeout(() => {
        setSystemHealth(mockSystemHealth)
        setSystemMetrics(mockSystemMetrics)
        setLastUpdated(new Date())
        setIsLoading(false)
      }, 1000)
    }

    loadData()

    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadData, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

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
    setIsLoading(true)
    setTimeout(() => {
      setSystemHealth(mockSystemHealth)
      setSystemMetrics(mockSystemMetrics)
      setLastUpdated(new Date())
      setIsLoading(false)
    }, 1000)
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
              {systemHealth!.overall === 'healthy' ? <CheckCircle size={14} className="mr-1" /> : 
               systemHealth!.overall === 'warning' ? <AlertTriangle size={14} className="mr-1" /> : 
               <XCircle size={14} className="mr-1" />}
              {systemHealth!.overall}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemHealth!.services.filter(s => s.status === 'up').length}/{systemHealth!.services.length}
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
              {systemMetrics!.realTimeStats.requestsPerSecond}
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
              {systemMetrics!.realTimeStats.activeUsers.toLocaleString()}
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
              {systemMetrics!.realTimeStats.responseTime}ms
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
                {systemHealth!.services.map((service, index) => (
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
                  <span className="text-sm text-gray-600">{systemMetrics!.resourceUsage.cpu}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics!.resourceUsage.cpu)}`}
                    style={{ width: `${systemMetrics!.resourceUsage.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Memory size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Memory</span>
                  </div>
                  <span className="text-sm text-gray-600">{systemMetrics!.resourceUsage.memory}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics!.resourceUsage.memory)}`}
                    style={{ width: `${systemMetrics!.resourceUsage.memory}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <HardDisk size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Disk</span>
                  </div>
                  <span className="text-sm text-gray-600">{systemMetrics!.resourceUsage.disk}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics!.resourceUsage.disk)}`}
                    style={{ width: `${systemMetrics!.resourceUsage.disk}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Wifi size={16} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">Network</span>
                  </div>
                  <span className="text-sm text-gray-600">{systemMetrics!.resourceUsage.network}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getResourceColor(systemMetrics!.resourceUsage.network)}`}
                    style={{ width: `${systemMetrics!.resourceUsage.network}%` }}
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
              {systemHealth!.alerts.length > 0 ? (
                <div className="space-y-3">
                  {systemHealth!.alerts.map((alert) => (
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
    </div>
  )
}