'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Users,
  Zap,
  Shield,
  FileText,
  Bell,
  Globe,
  Database,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Key,
  Wifi,
  WifiOff,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download
} from 'lucide-react'

interface SystemSettings {
  general: {
    siteName: string
    siteUrl: string
    description: string
    logoUrl: string
    timezone: string
    language: string
    currency: string
    dateFormat: string
  }
  company: {
    name: string
    address: string
    city: string
    country: string
    phone: string
    email: string
    taxId: string
  }
  notifications: {
    emailEnabled: boolean
    pushEnabled: boolean
    smsEnabled: boolean
    webhooksEnabled: boolean
  }
  features: {
    maintenanceMode: boolean
    registrationOpen: boolean
    bookingEnabled: boolean
    reviewsEnabled: boolean
    searchEnabled: boolean
    analyticsEnabled: boolean
  }
  configured: boolean
}

export default function GeneralSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings/general')
      if (!response.ok) {
        throw new Error('Failed to load settings')
      }
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
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
      const response = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setSuccess('Settings saved successfully')
      setHasChanges(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      [section]: {
        ...(settings[section] as any),
        [field]: value
      }
    })
    setHasChanges(true)
  }

  const resetSettings = () => {
    loadSettings()
    setHasChanges(false)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
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
            <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
            <div className="flex items-center space-x-2 mt-1">
              <WifiOff size={14} className="text-red-600" />
              <span className="text-sm text-red-600">Settings Service Not Configured</span>
              <span className="text-xs text-gray-500">• Configure settings management</span>
            </div>
          </div>
        </div>

        <EmptySettingsState />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
          <div className="flex items-center space-x-2 mt-1">
            <Wifi size={14} className="text-green-600" />
            <span className="text-sm text-green-600">Settings Active</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <button
              onClick={resetSettings}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <RotateCcw size={16} className="mr-2" />
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
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
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
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Site Settings</h3>
                <p className="text-sm text-gray-600">Basic site configuration</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
              <input
                type="url"
                value={settings.general.siteUrl}
                onChange={(e) => updateSettings('general', 'siteUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={settings.general.description}
                onChange={(e) => updateSettings('general', 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.general.language}
                  onChange={(e) => updateSettings('general', 'language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                <p className="text-sm text-gray-600">Business details and contact info</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={settings.company.name}
                onChange={(e) => updateSettings('company', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={settings.company.address}
                onChange={(e) => updateSettings('company', 'address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={settings.company.city}
                  onChange={(e) => updateSettings('company', 'city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={settings.company.country}
                  onChange={(e) => updateSettings('company', 'country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={settings.company.phone}
                  onChange={(e) => updateSettings('company', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.company.email}
                  onChange={(e) => updateSettings('company', 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">Communication preferences</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {key.replace('Enabled', '').replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Enable {key.replace('Enabled', '').toLowerCase()} notifications
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSettings('notifications', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Feature Controls</h3>
                <p className="text-sm text-gray-600">Enable or disable system features</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(settings.features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace('Mode', '').replace('Open', '').replace('Enabled', '').trim()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getFeatureDescription(key)}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSettings('features', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    key === 'maintenanceMode' 
                      ? 'bg-gray-200 peer-focus:ring-red-300 peer-checked:bg-red-600'
                      : 'bg-gray-200 peer-focus:ring-blue-300 peer-checked:bg-blue-600'
                  }`}></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    maintenanceMode: 'Put site into maintenance mode',
    registrationOpen: 'Allow new user registrations',
    bookingEnabled: 'Enable booking functionality',
    reviewsEnabled: 'Allow user reviews and ratings',
    searchEnabled: 'Enable search functionality',
    analyticsEnabled: 'Collect usage analytics'
  }
  return descriptions[key] || 'Toggle this feature'
}

function EmptySettingsState() {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <Settings size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Settings Management Not Configured
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        To manage system settings, configure the settings service and database connections.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h4 className="font-semibold text-gray-900 mb-4">Required Setup:</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Database size={12} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Database Connection</div>
              <div className="text-sm text-gray-600">Configure database for settings storage</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Key size={12} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Environment Variables</div>
              <div className="text-sm text-gray-600">Set up configuration management environment</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={12} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Admin Permissions</div>
              <div className="text-sm text-gray-600">Configure role-based access control</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Note:</strong> Contact your system administrator to configure settings management.
          </div>
        </div>
      </div>
    </div>
  )
}