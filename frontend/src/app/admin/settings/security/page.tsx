'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Lock,
  Key,
  Eye,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  RefreshCw,
  Search,
  Filter,
  Globe,
  Smartphone,
  Wifi,
  WifiOff,
  Activity,
  FileText,
  Database,
  Server,
  Mail,
  Bell,
  UserCheck,
  Zap,
  Calendar,
  MapPin,
  Monitor
} from 'lucide-react'

interface SecuritySettings {
  authentication: {
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSymbols: boolean
      passwordExpiry: number
    }
    twoFactorAuth: {
      enabled: boolean
      required: boolean
      methods: string[]
    }
    sessionManagement: {
      sessionTimeout: number
      maxConcurrentSessions: number
      rememberMeEnabled: boolean
    }
  }
  access: {
    ipWhitelist: string[]
    geoBlocking: {
      enabled: boolean
      blockedCountries: string[]
    }
    rateLimiting: {
      enabled: boolean
      requestsPerMinute: number
      blockDuration: number
    }
  }
  monitoring: {
    auditLogging: boolean
    loginTracking: boolean
    anomalyDetection: boolean
    alertsEnabled: boolean
  }
  configured: boolean
}

interface SecurityEvent {
  id: string
  timestamp: string
  type: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'security_alert'
  user: string
  ip: string
  location?: string
  device?: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export default function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    setIsLoading(true)
    try {
      const [settingsResponse, eventsResponse] = await Promise.all([
        fetch('/api/admin/settings/security'),
        fetch('/api/admin/settings/security/events')
      ])

      if (!settingsResponse.ok || !eventsResponse.ok) {
        throw new Error('Failed to load security data')
      }

      const settingsData = await settingsResponse.json()
      const eventsData = await eventsResponse.json()

      setSettings(settingsData)
      setSecurityEvents(eventsData.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save security settings')
      }

      setSuccess('Security settings saved successfully')
      setHasChanges(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save security settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSettings = (section: string, subsection: string, field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      [section]: {
        ...settings[section as keyof SecuritySettings],
        [subsection]: {
          ...(settings[section as keyof SecuritySettings] as any)[subsection],
          [field]: value
        }
      }
    })
    setHasChanges(true)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} className="text-red-600" />
      case 'high': return <AlertTriangle size={16} className="text-orange-600" />
      case 'medium': return <Eye size={16} className="text-yellow-600" />
      case 'low': return <CheckCircle size={16} className="text-green-600" />
      default: return <Eye size={16} className="text-gray-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login': return <UserCheck size={16} className="text-green-600" />
      case 'logout': return <Users size={16} className="text-gray-600" />
      case 'failed_login': return <XCircle size={16} className="text-red-600" />
      case 'permission_change': return <Key size={16} className="text-blue-600" />
      case 'security_alert': return <AlertTriangle size={16} className="text-orange-600" />
      default: return <Activity size={16} className="text-gray-600" />
    }
  }

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.ip.includes(searchTerm)
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter
    return matchesSearch && matchesSeverity
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
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
            <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-gray-600">Configure security policies and monitoring</p>
            <div className="flex items-center space-x-2 mt-1">
              <WifiOff size={14} className="text-red-600" />
              <span className="text-sm text-red-600">Security Management Not Configured</span>
              <span className="text-xs text-gray-500">• Configure security service</span>
            </div>
          </div>
        </div>

        <EmptySecurityState />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600">Configure security policies and monitoring</p>
          <div className="flex items-center space-x-2 mt-1">
            <Wifi size={14} className="text-green-600" />
            <span className="text-sm text-green-600">Security Active</span>
            <span className="text-xs text-gray-500">• {securityEvents.length} recent events</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <button
              onClick={() => { loadSecurityData(); setHasChanges(false) }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Reset
            </button>
          )}
          <button
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              hasChanges && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Shield size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle size={20} className="text-red-600 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle size={20} className="text-green-600 mr-3" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Authentication</h3>
                <p className="text-sm text-gray-600">Password and login policies</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Password Policy</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Length: {settings.authentication.passwordPolicy.minLength} characters
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    value={settings.authentication.passwordPolicy.minLength}
                    onChange={(e) => updateSettings('authentication', 'passwordPolicy', 'minLength', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {Object.entries({
                  requireUppercase: 'Require uppercase letters',
                  requireLowercase: 'Require lowercase letters',
                  requireNumbers: 'Require numbers',
                  requireSymbols: 'Require symbols'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings.authentication.passwordPolicy as any)[key]}
                        onChange={(e) => updateSettings('authentication', 'passwordPolicy', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enable 2FA</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.authentication.twoFactorAuth.enabled}
                      onChange={(e) => updateSettings('authentication', 'twoFactorAuth', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Require 2FA for all users</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.authentication.twoFactorAuth.required}
                      onChange={(e) => updateSettings('authentication', 'twoFactorAuth', 'required', e.target.checked)}
                      disabled={!settings.authentication.twoFactorAuth.enabled}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                      !settings.authentication.twoFactorAuth.enabled ? 'bg-gray-300' : 'bg-gray-200'
                    }`}></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Access Control</h3>
                <p className="text-sm text-gray-600">IP restrictions and geo-blocking</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">IP Whitelist</h4>
              <div className="space-y-2">
                {settings.access.ipWhitelist.length > 0 ? (
                  settings.access.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <code className="text-sm">{ip}</code>
                      <button className="text-red-600 hover:text-red-700">
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No IP restrictions configured</p>
                )}
                <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center">
                  <Zap size={14} className="mr-1" />
                  Add IP Address
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Geographic Blocking</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enable geo-blocking</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.access.geoBlocking.enabled}
                      onChange={(e) => updateSettings('access', 'geoBlocking', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.access.geoBlocking.blockedCountries.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Blocked countries: {settings.access.geoBlocking.blockedCountries.join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Rate Limiting</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enable rate limiting</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.access.rateLimiting.enabled}
                      onChange={(e) => updateSettings('access', 'rateLimiting', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.access.rateLimiting.enabled && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Requests per minute: {settings.access.rateLimiting.requestsPerMinute}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="1000"
                        value={settings.access.rateLimiting.requestsPerMinute}
                        onChange={(e) => updateSettings('access', 'rateLimiting', 'requestsPerMinute', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Security Monitoring</h3>
                <p className="text-sm text-gray-600">Audit logs and alerts</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries({
              auditLogging: 'Audit logging',
              loginTracking: 'Login tracking',
              anomalyDetection: 'Anomaly detection',
              alertsEnabled: 'Security alerts'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(settings.monitoring as any)[key]}
                    onChange={(e) => updateSettings('monitoring', '', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
                  <p className="text-sm text-gray-600">Latest security activity</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center">
                <Download size={14} className="mr-1" />
                Export
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{event.description}</span>
                        {getSeverityIcon(event.severity)}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          event.severity === 'critical' ? 'bg-red-100 text-red-600' :
                          event.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                          event.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {event.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-x-4">
                        <span>{event.user}</span>
                        <span>{event.ip}</span>
                        {event.location && <span>{event.location}</span>}
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No security events found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptySecurityState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Shield size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Security Management Not Configured
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To manage security settings and monitor events, configure the security management system.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Setup:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Authentication Security</div>
              <div className="text-sm text-gray-600">Password policies and multi-factor authentication</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Eye size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Security Monitoring</div>
              <div className="text-sm text-gray-600">Audit logging and anomaly detection</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Globe size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Access Controls</div>
              <div className="text-sm text-gray-600">IP restrictions and geographic blocking</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure security management.
          </div>
        </div>
      </div>
    </div>
  )
}