'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  User, 
  Bell, 
  Globe, 
  CreditCard,
  Shield,
  Plane,
  Save,
  Loader2
} from 'lucide-react'
import { ProtectedRoute, useUserAuth } from '@/contexts/UserAuthContext'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { user } = useUserAuth()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [preferences, setPreferences] = useState({
    currency: user?.preferences?.currency || 'EUR',
    language: user?.preferences?.language || 'en',
    cabinClass: user?.preferences?.preferredCabinClass || 'ECONOMY',
    newsletter: user?.preferences?.newsletter ?? true,
    priceAlerts: true,
    bookingReminders: true,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const currencies = [
    { value: 'EUR', label: '€ Euro' },
    { value: 'USD', label: '$ US Dollar' },
    { value: 'GBP', label: '£ British Pound' },
    { value: 'AUD', label: '$ Australian Dollar' },
  ]

  const cabinClasses = [
    { value: 'ECONOMY', label: 'Economy' },
    { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'FIRST', label: 'First Class' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="container mx-auto max-w-4xl">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-white/60 mt-1">Manage your account preferences</p>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Profile Information</h2>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/40 cursor-not-allowed"
                    />
                    <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">First Name</label>
                      <input
                        type="text"
                        defaultValue={user?.firstName || ''}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue={user?.lastName || ''}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Travel Preferences</h2>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Preferred Currency</label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences(p => ({ ...p, currency: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    >
                      {currencies.map(c => (
                        <option key={c.value} value={c.value} className="bg-slate-800">{c.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Preferred Cabin Class</label>
                    <select
                      value={preferences.cabinClass}
                      onChange={(e) => setPreferences(p => ({ ...p, cabinClass: e.target.value as typeof p.cabinClass }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    >
                      {cabinClasses.map(c => (
                        <option key={c.value} value={c.value} className="bg-slate-800">{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Notification Settings</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'newsletter', label: 'Newsletter', desc: 'Travel tips and destination inspiration' },
                    { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when prices drop' },
                    { key: 'bookingReminders', label: 'Booking Reminders', desc: 'Reminders about upcoming trips' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-white/60">{desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={(preferences as any)[key]}
                        onChange={(e) => setPreferences(p => ({ ...p, [key]: e.target.checked }))}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-yellow-400 focus:ring-yellow-400/50"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Security</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-white/60">Last changed: Never</p>
                      </div>
                      <button className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-white/60">Add an extra layer of security</p>
                      </div>
                      <button className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-400">Delete Account</p>
                        <p className="text-sm text-white/60">Permanently delete your account and data</p>
                      </div>
                      <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
