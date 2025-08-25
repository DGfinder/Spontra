'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  Plus,
  Search,
  Key,
  Globe,
  Database,
  Mail,
  CreditCard,
  MapPin,
  Video,
  Camera,
  Share2,
  BarChart3,
  Shield,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Settings,
  Link,
  Server,
  Cloud,
  Lock,
  Unlock,
  Activity
} from 'lucide-react'

interface APIIntegration {
  id: string
  name: string
  category: 'payment' | 'travel' | 'social' | 'analytics' | 'email' | 'storage' | 'maps'
  description: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  apiKey?: string
  endpoint?: string
  lastSync?: string
  config: Record<string, any>
  required: boolean
}

interface APISettings {
  integrations: APIIntegration[]
  webhooks: Array<{
    id: string
    url: string
    events: string[]
    status: 'active' | 'inactive'
    lastDelivery?: string
  }>
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
  configured: boolean
}

export default function APIIntegrationsSettings() {
  const [settings, setSettings] = useState<APISettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [selectedIntegration, setSelectedIntegration] = useState<APIIntegration | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadAPISettings()
  }, [])

  const loadAPISettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings/api')
      if (!response.ok) {
        throw new Error('Failed to load API settings')
      }
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API settings')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle size={16} className="text-green-600" />
      case 'disconnected': return <XCircle size={16} className="text-gray-600" />
      case 'error': return <AlertTriangle size={16} className="text-red-600" />
      case 'pending': return <Activity size={16} className="text-yellow-600 animate-pulse" />
      default: return <XCircle size={16} className="text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return <CreditCard size={20} className="text-green-600" />
      case 'travel': return <MapPin size={20} className="text-blue-600" />
      case 'social': return <Share2 size={20} className="text-purple-600" />
      case 'analytics': return <BarChart3 size={20} className="text-orange-600" />
      case 'email': return <Mail size={20} className="text-red-600" />
      case 'storage': return <Database size={20} className="text-indigo-600" />
      case 'maps': return <Globe size={20} className="text-teal-600" />
      default: return <Zap size={20} className="text-gray-600" />
    }
  }

  const toggleApiKeyVisibility = (integrationId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard')
    setTimeout(() => setSuccess(null), 2000)
  }

  const testConnection = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/api/test/${integrationId}`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Connection test failed')
      }
      setSuccess('Connection test successful')
      setTimeout(() => setSuccess(null), 3000)
      loadAPISettings() // Refresh data
    } catch (err) {
      setError('Connection test failed')
      setTimeout(() => setError(null), 3000)
    }
  }

  const filteredIntegrations = settings?.integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter
    return matchesSearch && matchesCategory
  }) || []

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
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
            <h1 className="text-2xl font-bold text-gray-900">API & Integrations</h1>
            <p className="text-gray-600">Manage external API connections and webhooks</p>
            <div className="flex items-center space-x-2 mt-1">
              <WifiOff size={14} className="text-red-600" />
              <span className="text-sm text-red-600">API Management Not Configured</span>
              <span className="text-xs text-gray-500">• Configure API integration system</span>
            </div>
          </div>
        </div>

        <EmptyAPIState />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API & Integrations</h1>
          <p className="text-gray-600">Manage external API connections and webhooks</p>
          <div className="flex items-center space-x-2 mt-1">
            <Wifi size={14} className="text-green-600" />
            <span className="text-sm text-green-600">API Management Active</span>
            <span className="text-xs text-gray-500">• {settings.integrations.filter(i => i.status === 'connected').length} connected</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
            <RefreshCw size={16} className="mr-2" />
            Sync All
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Plus size={16} className="mr-2" />
            Add Integration
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="payment">Payment</option>
              <option value="travel">Travel</option>
              <option value="social">Social Media</option>
              <option value="analytics">Analytics</option>
              <option value="email">Email</option>
              <option value="storage">Storage</option>
              <option value="maps">Maps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredIntegrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getCategoryIcon(integration.category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{integration.name}</span>
                      {integration.required && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Required</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(integration.status)}
                  <span className={`text-sm capitalize ${
                    integration.status === 'connected' ? 'text-green-600' :
                    integration.status === 'error' ? 'text-red-600' :
                    integration.status === 'pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {integration.status}
                  </span>
                </div>
              </div>

              {integration.apiKey && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type={showApiKey[integration.id] ? 'text' : 'password'}
                      value={integration.apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility(integration.id)}
                      className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                    >
                      {showApiKey[integration.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(integration.apiKey!)}
                      className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              )}

              {integration.endpoint && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={integration.endpoint}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(integration.endpoint!)}
                      className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              )}

              {integration.lastSync && (
                <div className="mb-4 text-sm text-gray-600">
                  <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 capitalize">
                  {integration.category} • {integration.status}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testConnection(integration.id)}
                    className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => setSelectedIntegration(integration)}
                    className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    <Edit size={14} className="mr-1 inline" />
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Zap size={32} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No integrations found matching your criteria</p>
        </div>
      )}

      {/* Rate Limits Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Rate Limits</h3>
              <p className="text-sm text-gray-600">Current API usage limits</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{settings.rateLimits.requestsPerMinute}</div>
              <div className="text-sm text-gray-600">Requests per minute</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{settings.rateLimits.requestsPerHour}</div>
              <div className="text-sm text-gray-600">Requests per hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{settings.rateLimits.requestsPerDay}</div>
              <div className="text-sm text-gray-600">Requests per day</div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Link size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
                <p className="text-sm text-gray-600">Manage webhook endpoints</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center">
              <Plus size={16} className="mr-2" />
              Add Webhook
            </button>
          </div>
        </div>

        <div className="p-6">
          {settings.webhooks.length > 0 ? (
            <div className="space-y-4">
              {settings.webhooks.map((webhook) => (
                <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{webhook.url}</code>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          webhook.status === 'active' 
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {webhook.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Events: {webhook.events.join(', ')}
                        {webhook.lastDelivery && (
                          <span className="ml-4">Last delivery: {new Date(webhook.lastDelivery).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Link size={32} className="mx-auto mb-2 text-gray-400" />
              <p>No webhooks configured</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyAPIState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Zap size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        API Integration Management Not Configured
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To manage API integrations and webhooks, configure the API management system.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Setup:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Key size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">API Key Management</div>
              <div className="text-sm text-gray-600">Secure storage and management of API credentials</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Link size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Webhook Infrastructure</div>
              <div className="text-sm text-gray-600">Configure webhook endpoints and event handling</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Server size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">External Service Connections</div>
              <div className="text-sm text-gray-600">Payment processors, travel APIs, and third-party services</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure API integrations.
          </div>
        </div>
      </div>
    </div>
  )
}