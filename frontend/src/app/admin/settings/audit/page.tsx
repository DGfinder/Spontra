'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  Eye,
  Edit,
  Trash2,
  Key,
  Shield,
  Database,
  Settings,
  Users,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Wifi,
  WifiOff,
  RefreshCw,
  Archive
} from 'lucide-react'

interface AuditLogEntry {
  id: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ip: string
  userAgent: string
  location?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'authentication' | 'data' | 'system' | 'security' | 'user' | 'content'
}

interface AuditSettings {
  retention: {
    days: number
    autoArchive: boolean
    archiveLocation: string
  }
  monitoring: {
    enabled: boolean
    realTimeAlerts: boolean
    emailNotifications: boolean
    webhookUrl?: string
  }
  categories: {
    authentication: boolean
    data: boolean
    system: boolean
    security: boolean
    user: boolean
    content: boolean
  }
  configured: boolean
}

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [settings, setSettings] = useState<AuditSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAuditData()
  }, [dateRange, categoryFilter, severityFilter])

  const loadAuditData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        dateRange,
        category: categoryFilter !== 'all' ? categoryFilter : '',
        severity: severityFilter !== 'all' ? severityFilter : ''
      })

      const [logsResponse, settingsResponse] = await Promise.all([
        fetch(`/api/admin/settings/audit/logs?${params}`),
        fetch('/api/admin/settings/audit')
      ])

      if (!logsResponse.ok || !settingsResponse.ok) {
        throw new Error('Failed to load audit data')
      }

      const logsData = await logsResponse.json()
      const settingsData = await settingsResponse.json()

      setAuditLogs(logsData.logs || [])
      setSettings(settingsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/admin/settings/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRange,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          severity: severityFilter !== 'all' ? severityFilter : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export logs')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export audit logs')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Key size={16} className="text-blue-600" />
      case 'data': return <Database size={16} className="text-green-600" />
      case 'system': return <Settings size={16} className="text-orange-600" />
      case 'security': return <Shield size={16} className="text-red-600" />
      case 'user': return <Users size={16} className="text-purple-600" />
      case 'content': return <FileText size={16} className="text-indigo-600" />
      default: return <Activity size={16} className="text-gray-600" />
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} className="text-red-600" />
      case 'high': return <AlertTriangle size={16} className="text-orange-600" />
      case 'medium': return <Info size={16} className="text-yellow-600" />
      case 'low': return <CheckCircle size={16} className="text-green-600" />
      default: return <Info size={16} className="text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="bg-white rounded-xl p-6">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!settings?.configured) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600">System activity logs and compliance records</p>
            <div className="flex items-center space-x-2 mt-1">
              <WifiOff size={14} className="text-red-600" />
              <span className="text-sm text-red-600">Audit Logging Not Configured</span>
              <span className="text-xs text-gray-500">• Configure audit system</span>
            </div>
          </div>
        </div>

        <EmptyAuditState />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">System activity logs and compliance records</p>
          <div className="flex items-center space-x-2 mt-1">
            <Wifi size={14} className="text-green-600" />
            <span className="text-sm text-green-600">Audit Logging Active</span>
            <span className="text-xs text-gray-500">• {auditLogs.length} entries found</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAuditData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle size={20} className="text-red-600 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="authentication">Authentication</option>
                <option value="data">Data</option>
                <option value="system">System</option>
                <option value="security">Security</option>
                <option value="user">User</option>
                <option value="content">Content</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Entries */}
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getCategoryIcon(entry.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{entry.action}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(entry.severity)}`}>
                          {entry.severity}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {entry.category}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{entry.user.name}</span>
                        <span className="mx-2">•</span>
                        <span>{entry.resource}</span>
                        {entry.resourceId && (
                          <>
                            <span className="mx-2">•</span>
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{entry.resourceId}</code>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{formatTimestamp(entry.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Globe size={12} />
                          <span>{entry.ip}</span>
                        </div>
                        {entry.location && (
                          <div className="flex items-center space-x-1">
                            <span>•</span>
                            <span>{entry.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(entry.severity)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEntry(entry)
                      }}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <FileText size={32} className="mx-auto mb-4 text-gray-400" />
              <p>No audit logs found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Settings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Archive size={20} className="text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{settings.retention.days}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Retention Days</h3>
          <p className="text-sm text-gray-600">Log retention period</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye size={20} className="text-green-600" />
            </div>
            <CheckCircle size={20} className={`${settings.monitoring.enabled ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Monitoring</h3>
          <p className="text-sm text-gray-600">{settings.monitoring.enabled ? 'Active' : 'Inactive'}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Filter size={20} className="text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {Object.values(settings.categories).filter(Boolean).length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Active Categories</h3>
          <p className="text-sm text-gray-600">Monitored event types</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {auditLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">High Priority</h3>
          <p className="text-sm text-gray-600">Critical & high severity events</p>
        </div>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Audit Log Details</h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <div className="text-sm text-gray-900">{formatTimestamp(selectedEntry.timestamp)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Severity</label>
                  <div className={`text-sm px-2 py-1 rounded inline-block ${getSeverityColor(selectedEntry.severity)}`}>
                    {selectedEntry.severity}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <div className="text-sm text-gray-900">
                    {selectedEntry.user.name} ({selectedEntry.user.email})
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <div className="text-sm text-gray-900">{selectedEntry.ip}</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Action</label>
                <div className="text-sm text-gray-900">{selectedEntry.action}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Resource</label>
                <div className="text-sm text-gray-900">
                  {selectedEntry.resource}
                  {selectedEntry.resourceId && ` (${selectedEntry.resourceId})`}
                </div>
              </div>
              {Object.keys(selectedEntry.details).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Details</label>
                  <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-auto">
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyAuditState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <FileText size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Audit Logging Not Configured
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To track system activity and maintain compliance records, configure audit logging.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Setup:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Database size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Audit Database</div>
              <div className="text-sm text-gray-600">Dedicated database for audit log storage</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Activity size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Event Tracking</div>
              <div className="text-sm text-gray-600">System-wide event monitoring and logging</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Archive size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Compliance Framework</div>
              <div className="text-sm text-gray-600">Data retention and compliance policies</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure audit logging.
          </div>
        </div>
      </div>
    </div>
  )
}