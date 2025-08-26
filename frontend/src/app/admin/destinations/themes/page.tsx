'use client'

import React, { useState, useEffect } from 'react'
import adminService from '@/services/adminService'
import { poiService } from '@/services/poiService'
import {
  Star,
  Plus,
  Edit,
  Save,
  X,
  Mountain,
  Coffee,
  TreePine,
  Zap,
  Compass,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  MapPin,
  Settings,
  Trash2,
  Copy
} from 'lucide-react'

interface Theme {
  id: string
  name: string
  key: string
  icon: string
  color: string
  description: string
  isActive: boolean
  destinations: number
  averageScore: number
  created: string
  updated: string
}

interface ThemeStats {
  totalThemes: number
  activeThemes: number
  averageUtilization: number
  topPerformingTheme: string
  needsAttention: number
}

interface DestinationThemeScore {
  iataCode: string
  cityName: string
  countryName: string
  score: number
  rank: number
  trending: 'up' | 'down' | 'stable'
}

export default function ThemeManagementPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [stats, setStats] = useState<ThemeStats | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [newTheme, setNewTheme] = useState({
    name: '',
    key: '',
    description: '',
    color: 'text-blue-600',
    icon: 'Star'
  })

  const [topDestinations, setTopDestinations] = useState<any[]>([])
  const [topPOIs, setTopPOIs] = useState<any[]>([])

  const loadThemeAnalytics = async (themeKey: string) => {
    try {
      // Use a sensible default origin for analytics
      const data = await adminService.getThemeDestinations({ origin: 'LHR', theme: themeKey, minScore: 60, limit: 20 })
      const items = (data?.destinations || data?.Destinations || [])
      setTopDestinations(items.slice(0, 10))

      // Fetch top POIs for the best destination (if available)
      const best = items[0]
      const code = best?.IataCode || best?.destination?.airport_code
      if (code) {
        try {
          const res = await poiService.listPOIs(code, { theme: themeKey as any, sortBy: 'popularity', sortOrder: 'desc', limit: 5 } as any)
          setTopPOIs(res.pois || [])
        } catch {
          setTopPOIs([])
        }
      } else {
        setTopPOIs([])
      }
    } catch (e) {
      console.warn('Theme analytics failed', e)
      setTopDestinations([])
      setTopPOIs([])
    }
  }

  const loadThemes = async () => {
    setIsLoading(true)
    try {
      const res = await adminService.listThemeDefinitions()
      const now = new Date().toISOString().split('T')[0]
      const mapped: Theme[] = res.themes.map((t, idx) => ({
        id: `${idx}`,
        name: t.name,
        key: t.key,
        icon: 'Star',
        color: 'text-blue-600',
        description: t.description,
        isActive: true,
        destinations: 0,
        averageScore: 0,
        created: now,
        updated: now
      }))
      setThemes(mapped)
      setStats({
        totalThemes: mapped.length,
        activeThemes: mapped.filter(x => x.isActive).length,
        averageUtilization: 0,
        topPerformingTheme: mapped[0]?.name || '-',
        needsAttention: 0
      })
      if (mapped[0]) setSelectedTheme(mapped[0])
    } catch (e) {
      console.error('Failed to load themes:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadThemes() }, [])

  useEffect(() => {
    if (selectedTheme && activeTab !== 'overview') {
      loadThemeAnalytics(selectedTheme.key)
    }
  }, [selectedTheme, activeTab])

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Star, Mountain, Coffee, TreePine, Zap, Compass, Target
    }
    return iconMap[iconName] || Star
  }

  const filteredThemes = themes.filter(theme => {
    if (searchQuery && !theme.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !theme.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus === 'active' && !theme.isActive) return false
    if (filterStatus === 'inactive' && theme.isActive) return false
    return true
  })

  const handleCreateTheme = async () => {
    await adminService.createOrUpdateThemeDefinition({ key: newTheme.key, name: newTheme.name, description: newTheme.description, keywords: [] })
    setShowCreateModal(false)
    setNewTheme({ name: '', key: '', description: '', color: 'text-blue-600', icon: 'Star' })
    loadThemes()
  }

  const toggleThemeStatus = async (_themeId: string) => {
    // No-op on backend; we keep this UI-only for now
  }

  const deleteTheme = async (themeId: string) => {
    const t = themes.find(x => x.id === themeId)
    if (!t) return
    if (confirm('Are you sure you want to delete this theme?')) {
      await adminService.deleteThemeDefinition(t.key)
      if (selectedTheme?.id === themeId) setSelectedTheme(null)
      loadThemes()
    }
  }

  const duplicateTheme = (theme: Theme) => {
    const duplicated: Theme = {
      ...theme,
      id: Date.now().toString(),
      name: `${theme.name} Copy`,
      key: `${theme.key}_copy`,
      destinations: 0,
      averageScore: 0,
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0]
    }
    setThemes([...themes, duplicated])
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
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
          <h1 className="text-2xl font-bold text-gray-900">Theme Management</h1>
          <p className="text-gray-600">Manage destination themes and scoring system</p>
        </div>
        
        {/* Read-only: create disabled */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Themes</div>
            <Star size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalThemes}</div>
          <div className="text-sm text-gray-500">{stats?.activeThemes} active</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Utilization</div>
            <BarChart3 size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.averageUtilization}%</div>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp size={14} className="mr-1" />
            +3.2% vs last month
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Top Performer</div>
            <Target size={20} className="text-purple-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{stats?.topPerformingTheme}</div>
          <div className="text-sm text-gray-500">Avg score: 8.1/10</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Needs Attention</div>
            <AlertTriangle size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.needsAttention}</div>
          <div className="text-sm text-orange-600">Low utilization themes</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Themes List */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Themes</h3>
              <span className="text-sm text-gray-500">{filteredThemes.length} themes</span>
            </div>
            
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search themes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Themes</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {filteredThemes.map((theme) => {
              const IconComponent = getIconComponent(theme.icon)
              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedTheme?.id === theme.id 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${theme.color} bg-opacity-10`}>
                        <IconComponent size={16} className={theme.color} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{theme.name}</h4>
                        <p className="text-xs text-gray-500">{theme.key}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      theme.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {theme.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{theme.destinations} destinations</span>
                    <span className="font-semibold text-gray-900">{theme.averageScore.toFixed(1)}/10</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Theme Details */}
        <div className="xl:col-span-2">
          {selectedTheme ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {/* Theme Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${selectedTheme.color} bg-opacity-10`}>
                      {React.createElement(getIconComponent(selectedTheme.icon), {
                        size: 24,
                        className: selectedTheme.color
                      })}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedTheme.name}</h3>
                      <p className="text-gray-600">Key: {selectedTheme.key}</p>
                    </div>
                  </div>
                  
                  {/* Read-only: actions disabled */}
                </div>

                {/* Tabs */}
                <div className="flex space-x-4">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'destinations', label: 'Top Destinations' },
                    { id: 'analytics', label: 'Analytics' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      {isEditing ? (
                        <textarea
                          value={selectedTheme.description}
                          onChange={(e) => setSelectedTheme({...selectedTheme, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedTheme.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Destinations</span>
                          <MapPin size={16} className="text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{selectedTheme.destinations}</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Average Score</span>
                          <Star size={16} className="text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{selectedTheme.averageScore.toFixed(1)}/10</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Status</span>
                          <CheckCircle size={16} className={selectedTheme.isActive ? 'text-green-600' : 'text-gray-400'} />
                        </div>
                        <div className={`text-lg font-bold ${selectedTheme.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                          {selectedTheme.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Theme Metadata</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2 text-gray-900">{selectedTheme.created}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="ml-2 text-gray-900">{selectedTheme.updated}</span>
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'destinations' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Top Destinations for {selectedTheme.name}
                    </h4>
                    <div className="space-y-3 mb-6">
                      {topDestinations.length === 0 && (
                        <div className="text-sm text-gray-500">No destinations found for this theme yet.</div>
                      )}
                      {topDestinations.map((d, idx) => {
                        const code = d.IataCode || d.destination?.airport_code
                        const city = d.CityName || d.destination?.city_name
                        const country = d.CountryName || d.destination?.country_name
                        const score = d.ThemeScore || d.match_score || 0
                        return (
                          <div key={`${code}-${idx}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{code}</span>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">{city}</h5>
                                <p className="text-sm text-gray-600">{country}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{Number(score).toFixed(1)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Top POIs</h4>
                    <div className="space-y-3">
                      {topPOIs.length === 0 && (
                        <div className="text-sm text-gray-500">No POIs available for the top destination.</div>
                      )}
                      {topPOIs.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-semibold text-gray-900">{p.name}</h5>
                            <p className="text-sm text-gray-600">{p.categoryId}</p>
                          </div>
                          <div className="text-right text-sm">
                            <div>Popularity: {p.popularityScore}</div>
                            {p.rating ? <div>Rating: {p.rating}</div> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Theme Analytics</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">Score Distribution</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>9-10 (Excellent)</span>
                            <span className="font-medium">12 destinations</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span>7-8.9 (Good)</span>
                            <span className="font-medium">18 destinations</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '38%' }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span>5-6.9 (Fair)</span>
                            <span className="font-medium">15 destinations</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '31%' }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span>0-4.9 (Poor)</span>
                            <span className="font-medium">3 destinations</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '6%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">Performance Trends</h5>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">This Month</span>
                            <div className="flex items-center text-green-600">
                              <TrendingUp size={14} className="mr-1" />
                              <span className="font-medium">+0.3 avg score</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">New Destinations</span>
                            <span className="font-medium text-gray-900">+3 this month</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Improvements Needed</span>
                            <span className="font-medium text-orange-600">5 destinations</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Star size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Theme</h3>
              <p className="text-gray-600">Choose a theme from the list to view its details and manage settings.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Theme Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Theme</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme Name</label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={(e) => setNewTheme({...newTheme, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g. Romance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key</label>
                <input
                  type="text"
                  value={newTheme.key}
                  onChange={(e) => setNewTheme({...newTheme, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g. romance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTheme.description}
                  onChange={(e) => setNewTheme({...newTheme, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Describe what this theme represents..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={newTheme.color}
                    onChange={(e) => setNewTheme({...newTheme, color: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="text-blue-600">Blue</option>
                    <option value="text-purple-600">Purple</option>
                    <option value="text-green-600">Green</option>
                    <option value="text-orange-600">Orange</option>
                    <option value="text-red-600">Red</option>
                    <option value="text-pink-600">Pink</option>
                    <option value="text-amber-600">Amber</option>
                    <option value="text-indigo-600">Indigo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <select
                    value={newTheme.icon}
                    onChange={(e) => setNewTheme({...newTheme, icon: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="Star">Star</option>
                    <option value="Mountain">Mountain</option>
                    <option value="Coffee">Coffee</option>
                    <option value="TreePine">TreePine</option>
                    <option value="Zap">Zap</option>
                    <option value="Compass">Compass</option>
                    <option value="Target">Target</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCreateTheme}
                disabled={!newTheme.name || !newTheme.key}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Theme
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}