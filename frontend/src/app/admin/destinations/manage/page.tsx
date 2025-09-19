'use client'

import { useEffect, useState } from 'react'
import { Search, Edit, MapPin, Plane, Check, X, Plus, Image, Video } from 'lucide-react'

type ThemeKey = 'vibe' | 'adventure' | 'discover' | 'indulge' | 'nature'

interface Destination {
  airport_code: string
  name: string
  city: string
  country: string
  country_code: string
  latitude?: number
  longitude?: number
  is_active: boolean
  flight_count: number
  themes: Record<ThemeKey, boolean>
  hero_image?: string
  description?: string
  highlights: string[]
  activities: Record<ThemeKey, string[]>
  videos: Record<ThemeKey, string[]>
}

interface DestinationModalProps {
  destination: Destination | null
  isOpen: boolean
  onClose: () => void
  onSave: (destination: Destination) => void
}

function DestinationModal({ destination, isOpen, onClose, onSave }: DestinationModalProps) {
  const [editData, setEditData] = useState<Destination | null>(null)

  useEffect(() => {
    if (destination) {
      setEditData({ ...destination })
    }
  }, [destination])

  if (!isOpen || !editData) return null

  const themes: { key: ThemeKey; name: string; color: string }[] = [
    { key: 'vibe', name: 'City Vibe', color: 'text-purple-600' },
    { key: 'adventure', name: 'Adventure', color: 'text-orange-600' },
    { key: 'discover', name: 'Discovery', color: 'text-blue-600' },
    { key: 'indulge', name: 'Indulgence', color: 'text-amber-600' },
    { key: 'nature', name: 'Nature', color: 'text-green-600' }
  ]

  const handleSave = () => {
    if (editData) {
      onSave(editData)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Edit Destination: {editData.city}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3"
                rows={3}
                placeholder="Brief description of the destination..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Image URL
              </label>
              <input
                type="url"
                value={editData.hero_image || ''}
                onChange={(e) => setEditData({ ...editData, hero_image: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Themes and Activities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Themes & Activities</h3>
            
            {themes.map((theme) => (
              <div key={theme.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.themes[theme.key] || false}
                        onChange={(e) => setEditData({
                          ...editData,
                          themes: { ...editData.themes, [theme.key]: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`font-medium ${theme.color}`}>{theme.name}</span>
                    </label>
                  </div>
                </div>

                {editData.themes[theme.key] && (
                  <div className="space-y-3 ml-6">
                    {/* Activities */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activities (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editData.activities[theme.key]?.join(', ') || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          activities: {
                            ...editData.activities,
                            [theme.key]: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          }
                        })}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        placeholder={`${theme.name} activities...`}
                      />
                    </div>

                    {/* Videos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video URLs (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editData.videos[theme.key]?.join(', ') || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          videos: {
                            ...editData.videos,
                            [theme.key]: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          }
                        })}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        placeholder="YouTube URLs for this theme..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Highlights (comma-separated)
            </label>
            <input
              type="text"
              value={editData.highlights.join(', ')}
              onChange={(e) => setEditData({
                ...editData,
                highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="Top attractions, must-see places..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DestinationManagePage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTheme, setFilterTheme] = useState<ThemeKey | 'all'>('all')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const themes: { key: ThemeKey; name: string; color: string }[] = [
    { key: 'vibe', name: 'Vibe', color: 'text-purple-600' },
    { key: 'adventure', name: 'Adventure', color: 'text-orange-600' },
    { key: 'discover', name: 'Discover', color: 'text-blue-600' },
    { key: 'indulge', name: 'Indulge', color: 'text-amber-600' },
    { key: 'nature', name: 'Nature', color: 'text-green-600' }
  ]

  // Fetch destinations from airports with flight data
  const fetchDestinations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/destinations/list-from-airports')
      if (response.ok) {
        const data = await response.json()
        setDestinations(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch destinations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save destination changes
  const saveDestination = async (destination: Destination) => {
    try {
      const response = await fetch('/api/admin/destinations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destination)
      })

      if (response.ok) {
        await fetchDestinations() // Refresh the list
      } else {
        alert('Failed to save destination')
      }
    } catch (error) {
      console.error('Failed to save destination:', error)
      alert('Failed to save destination')
    }
  }

  // Filter destinations
  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = !searchTerm || 
      dest.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.airport_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesActiveFilter = filterActive === 'all' || 
      (filterActive === 'active' && dest.is_active) ||
      (filterActive === 'inactive' && !dest.is_active)
    
    const matchesThemeFilter = filterTheme === 'all' || dest.themes[filterTheme]
    
    return matchesSearch && matchesActiveFilter && matchesThemeFilter
  })

  useEffect(() => {
    fetchDestinations()
  }, [])

  const openEditModal = (destination: Destination) => {
    setSelectedDestination(destination)
    setIsModalOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinations Management</h1>
          <p className="text-gray-600">Curate destinations and manage theme associations</p>
        </div>
        <div className="text-sm text-gray-500">
          {destinations.length} destinations • {destinations.filter(d => d.is_active).length} active
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search destinations..."
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Filter by Theme */}
          <select
            value={filterTheme}
            onChange={(e) => setFilterTheme(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Themes</option>
            {themes.map(theme => (
              <option key={theme.key} value={theme.key}>{theme.name}</option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            onClick={fetchDestinations}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Search size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredDestinations.length} destinations
      </div>

      {/* Destinations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading destinations...</div>
        ) : filteredDestinations.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No destinations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Destination</th>
                  <th className="text-left p-4 font-medium text-gray-900">Flights</th>
                  <th className="text-center p-4 font-medium text-gray-900">Vibe</th>
                  <th className="text-center p-4 font-medium text-gray-900">Adventure</th>
                  <th className="text-center p-4 font-medium text-gray-900">Discover</th>
                  <th className="text-center p-4 font-medium text-gray-900">Indulge</th>
                  <th className="text-center p-4 font-medium text-gray-900">Nature</th>
                  <th className="text-center p-4 font-medium text-gray-900">Status</th>
                  <th className="text-center p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDestinations.map((destination) => (
                  <tr key={destination.airport_code} className="hover:bg-gray-50">
                    {/* Destination Info */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{destination.airport_code}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{destination.city}</div>
                          <div className="text-sm text-gray-600">{destination.country}</div>
                        </div>
                      </div>
                    </td>

                    {/* Flight Count */}
                    <td className="p-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Plane size={14} className="mr-1" />
                        {destination.flight_count} routes
                      </div>
                    </td>

                    {/* Theme Checkmarks */}
                    {themes.map((theme) => (
                      <td key={theme.key} className="p-4 text-center">
                        {destination.themes[theme.key] ? (
                          <Check size={16} className={`mx-auto ${theme.color}`} />
                        ) : (
                          <div className="w-4 h-4 mx-auto"></div>
                        )}
                      </td>
                    ))}

                    {/* Status */}
                    <td className="p-4 text-center">
                      {destination.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openEditModal(destination)}
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={14} />
                        <span className="text-sm">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <DestinationModal
        destination={selectedDestination}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDestination(null)
        }}
        onSave={saveDestination}
      />
    </div>
  )
}