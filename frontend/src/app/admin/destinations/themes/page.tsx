'use client'

import React, { useState, useEffect } from 'react'
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

  // Mock data
  const mockThemes: Theme[] = [
    {
      id: '1',
      name: 'City Vibe',
      key: 'vibe',
      icon: 'Zap',
      color: 'text-purple-600',
      description: 'Nightlife, culture, and urban energy that makes a city come alive after dark',
      isActive: true,
      destinations: 47,
      averageScore: 7.2,
      created: '2023-06-01',
      updated: '2024-01-15'
    },
    {
      id: '2',
      name: 'Adventure',
      key: 'adventure',
      icon: 'Mountain',
      color: 'text-orange-600',
      description: 'Outdoor activities, extreme sports, and thrilling experiences for adrenaline seekers',
      isActive: true,
      destinations: 42,
      averageScore: 6.8,
      created: '2023-06-01',
      updated: '2024-01-12'
    },
    {
      id: '3',
      name: 'Discovery',
      key: 'discover',
      icon: 'Compass',
      color: 'text-blue-600',
      description: 'Historical sites, museums, cultural exploration, and learning experiences',
      isActive: true,
      destinations: 45,
      averageScore: 8.1,
      created: '2023-06-01',
      updated: '2024-01-18'
    },
    {
      id: '4',
      name: 'Indulgence',
      key: 'indulge',
      icon: 'Coffee',
      color: 'text-amber-600',
      description: 'Fine dining, luxury shopping, spas, and premium experiences',
      isActive: true,
      destinations: 38,
      averageScore: 7.5,
      created: '2023-06-01',
      updated: '2024-01-10'
    },
    {
      id: '5',
      name: 'Nature',
      key: 'nature',
      icon: 'TreePine',
      color: 'text-green-600',
      description: 'Natural beauty, parks, outdoor settings, and eco-friendly activities',
      isActive: true,
      destinations: 35,
      averageScore: 6.9,
      created: '2023-06-01',
      updated: '2024-01-16'
    },
    {
      id: '6',
      name: 'Romance',
      key: 'romance',
      icon: 'Heart',
      color: 'text-pink-600',
      description: 'Romantic settings, couples activities, and intimate experiences',
      isActive: false,
      destinations: 0,
      averageScore: 0,
      created: '2023-12-15',
      updated: '2023-12-15'
    }
  ]

  const mockStats: ThemeStats = {
    totalThemes: 6,
    activeThemes: 5,
    averageUtilization: 73.2,
    topPerformingTheme: 'Discovery',
    needsAttention: 2
  }

  const mockDestinationScores: DestinationThemeScore[] = [
    { iataCode: 'ROM', cityName: 'Rome', countryName: 'Italy', score: 9.2, rank: 1, trending: 'up' },
    { iataCode: 'ATH', cityName: 'Athens', countryName: 'Greece', score: 8.9, rank: 2, trending: 'stable' },
    { iataCode: 'BCN', cityName: 'Barcelona', countryName: 'Spain', score: 8.7, rank: 3, trending: 'up' },
    { iataCode: 'PAR', cityName: 'Paris', countryName: 'France', score: 8.5, rank: 4, trending: 'down' },
    { iataCode: 'VIE', cityName: 'Vienna', countryName: 'Austria', score: 8.3, rank: 5, trending: 'stable' }
  ]

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        setThemes(mockThemes)
        setStats(mockStats)
        setSelectedTheme(mockThemes[0])
      } catch (error) {
        console.error('Failed to load themes:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

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

  const handleCreateTheme = () => {
    const theme: Theme = {
      id: Date.now().toString(),
      name: newTheme.name,
      key: newTheme.key,
      icon: newTheme.icon,
      color: newTheme.color,
      description: newTheme.description,
      isActive: true,
      destinations: 0,
      averageScore: 0,
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0]
    }
    
    setThemes([...themes, theme])
    setShowCreateModal(false)
    setNewTheme({
      name: '',
      key: '',
      description: '',
      color: 'text-blue-600',
      icon: 'Star'
    })
  }

  const toggleThemeStatus = (themeId: string) => {
    setThemes(themes.map(theme => 
      theme.id === themeId ? { ...theme, isActive: !theme.isActive } : theme
    ))
  }

  const deleteTheme = (themeId: string) => {
    if (confirm('Are you sure you want to delete this theme? This action cannot be undone.')) {
      setThemes(themes.filter(theme => theme.id !== themeId))
      if (selectedTheme?.id === themeId) {
        setSelectedTheme(themes.find(t => t.id !== themeId) || null)
      }
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
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Create Theme
        </button>
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
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => duplicateTheme(selectedTheme)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Duplicate theme"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => toggleThemeStatus(selectedTheme.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedTheme.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {selectedTheme.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteTheme(selectedTheme.id)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                    
                    <div className="space-y-3">
                      {mockDestinationScores.map((destination) => (
                        <div key={destination.iataCode} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs">{destination.iataCode}</span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{destination.cityName}</h5>
                              <p className="text-sm text-gray-600">{destination.countryName}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{destination.score.toFixed(1)}/10</div>
                              <div className="text-sm text-gray-600">#{destination.rank}</div>
                            </div>
                            
                            {destination.trending === 'up' && <TrendingUp size={16} className="text-green-500" />}
                            {destination.trending === 'down' && <TrendingDown size={16} className="text-red-500" />}
                            {destination.trending === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
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