'use client'

import { useState, useEffect } from 'react'
import { getDestinations, getDestinationWithPOIs } from '@/actions/destinationActions'
import { createPOI, updatePOI, deletePOI, reorderPOI } from '@/actions/themePOIActions'

interface Destination {
  id: string
  cityName: string
  airportCode: string
  country: {
    name: string
    code: string
  } | null
  _count: {
    themePOIs: number
  }
}

interface ThemePOI {
  id: string
  theme: string
  name: string
  description: string | null
  videoUrl: string | null
  displayOrder: number
}

interface DestinationWithPOIs {
  id: string
  cityName: string
  airportCode: string
  description: string | null
  popularityScore: number | null
  country: {
    name: string
    code: string
  }
  themePOIs: ThemePOI[]
}

const THEMES = [
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'nature', label: 'Nature', emoji: '🌲' },
  { value: 'vibe', label: 'Vibe', emoji: '🎭' },
  { value: 'indulge', label: 'Indulge', emoji: '🍷' },
  { value: 'discover', label: 'Discover', emoji: '🔍' }
]

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDestination, setSelectedDestination] = useState<DestinationWithPOIs | null>(null)
  const [activeTheme, setActiveTheme] = useState('adventure')
  const [isAddingPOI, setIsAddingPOI] = useState(false)
  const [newPOI, setNewPOI] = useState({ name: '', description: '', videoUrl: '' })

  useEffect(() => {
    loadDestinations()
  }, [])

  async function loadDestinations() {
    setIsLoading(true)
    const result = await getDestinations()
    if (result.success && result.data) {
      setDestinations(result.data)
    }
    setIsLoading(false)
  }

  async function openPOIModal(destinationId: string) {
    const result = await getDestinationWithPOIs(destinationId)
    if (result.success && result.data) {
      setSelectedDestination(result.data)
      setActiveTheme('adventure')
    }
  }

  function closePOIModal() {
    setSelectedDestination(null)
    setIsAddingPOI(false)
    setNewPOI({ name: '', description: '', videoUrl: '' })
    loadDestinations()
  }

  async function handleCreatePOI() {
    if (!selectedDestination || !newPOI.name) return

    const result = await createPOI({
      destinationId: selectedDestination.id,
      theme: activeTheme,
      name: newPOI.name,
      description: newPOI.description || undefined,
      videoUrl: newPOI.videoUrl || undefined
    })

    if (result.success) {
      setIsAddingPOI(false)
      setNewPOI({ name: '', description: '', videoUrl: '' })
      // Reload destination to show new POI
      openPOIModal(selectedDestination.id)
    } else {
      alert(result.error)
    }
  }

  async function handleDeletePOI(poiId: string) {
    if (!confirm('Delete this POI?')) return

    const result = await deletePOI(poiId)
    if (result.success && selectedDestination) {
      openPOIModal(selectedDestination.id)
    } else {
      alert(result.error)
    }
  }

  async function handleReorder(poiId: string, direction: 'up' | 'down') {
    const result = await reorderPOI(poiId, direction)
    if (result.success && selectedDestination) {
      openPOIModal(selectedDestination.id)
    } else if (result.error) {
      alert(result.error)
    }
  }

  const themePOIs = selectedDestination?.themePOIs.filter(p => p.theme === activeTheme) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Destinations</h1>
        <p className="text-white/70 mt-1">Manage destination content and theme POIs</p>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Airport
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                POIs
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {destinations.map((dest) => (
              <tr key={dest.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {dest.cityName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                  {dest.country?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                  {dest.airportCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                  {dest._count.themePOIs} POIs
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openPOIModal(dest.id)}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    Manage POIs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POI Modal */}
      {selectedDestination && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedDestination.cityName}, {selectedDestination.country.name}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    {selectedDestination.airportCode} • {selectedDestination.themePOIs.length} total POIs
                  </p>
                </div>
                <button
                  onClick={closePOIModal}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Theme Tabs */}
            <div className="flex border-b border-white/10 px-6">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setActiveTheme(theme.value)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTheme === theme.value
                      ? 'text-white border-white'
                      : 'text-white/60 border-transparent hover:text-white/80'
                  }`}
                >
                  {theme.emoji} {theme.label}
                </button>
              ))}
            </div>

            {/* POI List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {themePOIs.map((poi, index) => (
                  <div
                    key={poi.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{poi.name}</h3>
                        {poi.description && (
                          <p className="text-white/60 text-sm mt-1">{poi.description}</p>
                        )}
                        {poi.videoUrl && (
                          <a
                            href={poi.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 text-sm mt-2 inline-block hover:underline"
                          >
                            🎬 {poi.videoUrl}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleReorder(poi.id, 'up')}
                          disabled={index === 0}
                          className="text-white/60 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReorder(poi.id, 'down')}
                          disabled={index === themePOIs.length - 1}
                          className="text-white/60 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleDeletePOI(poi.id)}
                          className="text-red-300 hover:text-red-200 ml-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {themePOIs.length === 0 && !isAddingPOI && (
                  <p className="text-center text-white/50 py-8">
                    No POIs for this theme yet
                  </p>
                )}
              </div>

              {/* Add POI Form */}
              {isAddingPOI ? (
                <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-3">Add New POI</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="POI Name"
                      value={newPOI.name}
                      onChange={(e) => setNewPOI({ ...newPOI, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newPOI.description}
                      onChange={(e) => setNewPOI({ ...newPOI, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      rows={2}
                    />
                    <input
                      type="url"
                      placeholder="YouTube Shorts URL (optional)"
                      value={newPOI.videoUrl}
                      onChange={(e) => setNewPOI({ ...newPOI, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsAddingPOI(false)
                          setNewPOI({ name: '', description: '', videoUrl: '' })
                        }}
                        className="px-3 py-1 text-white/70 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePOI}
                        className="px-3 py-1 bg-white text-brand-purple rounded-lg font-medium hover:bg-white/90"
                      >
                        Add POI
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingPOI(true)}
                  className="mt-4 w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  + Add New POI
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
