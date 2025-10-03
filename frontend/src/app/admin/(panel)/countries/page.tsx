'use client'

import React, { useState, useEffect } from 'react'
import { getCountries, getCountryWithCities, createCountry, updateCountry, deleteCountry } from '@/actions/countryActions'
import { getDestinationWithPOIs } from '@/actions/destinationActions'
import { createPOI, deletePOI, reorderPOI } from '@/actions/themePOIActions'
import { addVideos, deleteVideo, reorderVideo } from '@/actions/poiVideoActions'
import { VideoCard } from '@/components/admin/VideoCard'
import { AddVideosForm } from '@/components/admin/AddVideosForm'
import { ChevronDown, ChevronRight, Film } from 'lucide-react'

interface Country {
  id: string
  name: string
  code: string
  _count: {
    destinations: number
  }
}

interface CityInCountry {
  id: string
  cityName: string
  airportCode: string | null
  airports: Array<{
    iataCode: string
    name: string
    isPrimary: boolean
  }>
  _count: {
    themePOIs: number
  }
}

interface POIVideo {
  id: string
  poiId: string
  videoUrl: string
  displayOrder: number
  createdAt: Date
}

interface ThemePOI {
  id: string
  theme: string
  name: string
  description: string | null
  videoUrl: string | null
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  videos: POIVideo[]
}

interface DestinationWithPOIs {
  id: string
  cityName: string
  airportCode: string | null
  description: string | null
  popularityScore: number | null
  country: {
    id: string
    name: string
    code: string
    createdAt: string
    updatedAt: string
  } | null
  themePOIs: ThemePOI[]
}

const THEMES = [
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'nature', label: 'Nature', emoji: '🌲' },
  { value: 'vibe', label: 'Vibe', emoji: '🎭' },
  { value: 'indulge', label: 'Indulge', emoji: '🍷' },
  { value: 'discover', label: 'Discover', emoji: '🔍' }
]

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '' })

  // Expansion state
  const [expandedCountryId, setExpandedCountryId] = useState<string | null>(null)
  const [citiesInCountry, setCitiesInCountry] = useState<CityInCountry[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  // POI Modal state (same as destinations page)
  const [selectedDestination, setSelectedDestination] = useState<DestinationWithPOIs | null>(null)
  const [activeTheme, setActiveTheme] = useState('adventure')
  const [isAddingPOI, setIsAddingPOI] = useState(false)
  const [newPOI, setNewPOI] = useState({ name: '', description: '', videoUrl: '' })

  // Video management state
  const [selectedPOI, setSelectedPOI] = useState<ThemePOI | null>(null)
  const [isAddingVideos, setIsAddingVideos] = useState(false)
  const [isSubmittingVideos, setIsSubmittingVideos] = useState(false)

  useEffect(() => {
    loadCountries()
  }, [])

  async function loadCountries() {
    setIsLoading(true)
    const result = await getCountries()
    if (result.success && result.data) {
      setCountries(result.data)
    }
    setIsLoading(false)
  }

  function openCreateForm() {
    setEditingCountry(null)
    setFormData({ name: '', code: '' })
    setIsFormOpen(true)
  }

  function openEditForm(country: Country) {
    setEditingCountry(country)
    setFormData({ name: country.name, code: country.code })
    setIsFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editingCountry) {
      const result = await updateCountry(editingCountry.id, formData)
      if (result.success) {
        await loadCountries()
        setIsFormOpen(false)
      } else {
        alert(result.error)
      }
    } else {
      const result = await createCountry(formData)
      if (result.success) {
        await loadCountries()
        setIsFormOpen(false)
      } else {
        alert(result.error)
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this country?')) return

    const result = await deleteCountry(id)
    if (result.success) {
      await loadCountries()
    } else {
      alert(result.error)
    }
  }

  async function toggleCountryExpansion(countryId: string) {
    if (expandedCountryId === countryId) {
      // Collapse
      setExpandedCountryId(null)
      setCitiesInCountry([])
    } else {
      // Expand
      setExpandedCountryId(countryId)
      setLoadingCities(true)
      const result = await getCountryWithCities(countryId)
      if (result.success && result.data) {
        setCitiesInCountry(result.data)
      }
      setLoadingCities(false)
    }
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
    setSelectedPOI(null)
    setIsAddingVideos(false)
    loadCountries()
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

  // Video management functions
  async function handleAddVideos(videoUrls: string[]) {
    if (!selectedPOI) return
    setIsSubmittingVideos(true)
    const result = await addVideos(selectedPOI.id, videoUrls)
    if (result.success) {
      setIsAddingVideos(false)
      setSelectedPOI(null)
      if (selectedDestination) {
        await openPOIModal(selectedDestination.id)
      }
    } else {
      alert(result.error)
    }
    setIsSubmittingVideos(false)
  }

  async function handleDeleteVideo(videoId: string) {
    if (!confirm('Delete this video?')) return
    const result = await deleteVideo(videoId)
    if (result.success && selectedDestination) {
      await openPOIModal(selectedDestination.id)
    } else {
      alert(result.error)
    }
  }

  async function handleReorderVideo(videoId: string, direction: 'up' | 'down') {
    const result = await reorderVideo(videoId, direction)
    if (result.success && selectedDestination) {
      await openPOIModal(selectedDestination.id)
    } else if (result.error) {
      alert(result.error)
    }
  }

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Countries</h1>
          <p className="text-white/70 mt-1">Manage countries for destination organization</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-white text-brand-purple px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          + Add Country
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Country Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                ISO Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Destinations
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {countries.map((country) => {
              const isExpanded = expandedCountryId === country.id
              return (
                <React.Fragment key={country.id}>
                  {/* Main Country Row */}
                  <tr
                    onClick={() => toggleCountryExpansion(country.id)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-white/70" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/70" />
                        )}
                        {country.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {country.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {country._count.destinations} cities
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditForm(country)
                        }}
                        className="text-blue-300 hover:text-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(country.id)
                        }}
                        className="text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Cities Section */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} className="bg-white/5 px-6 py-4">
                        {loadingCities ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-white"></div>
                          </div>
                        ) : citiesInCountry.length === 0 ? (
                          <div className="text-center py-8 text-white/50">
                            No cities in this country yet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Summary */}
                            <div className="flex items-center gap-6 text-sm text-white/70 pb-2 border-b border-white/10">
                              <span>{citiesInCountry.length} cities</span>
                              <span>{citiesInCountry.reduce((sum, city) => sum + city._count.themePOIs, 0)} total POIs</span>
                              <span>{citiesInCountry.reduce((sum, city) => sum + city.airports.length, 0)} airports</span>
                            </div>

                            {/* Nested Cities Table */}
                            <table className="min-w-full">
                              <thead>
                                <tr className="text-xs text-white/50 uppercase">
                                  <th className="text-left pb-2">City Name</th>
                                  <th className="text-left pb-2">Airports</th>
                                  <th className="text-left pb-2">POIs</th>
                                  <th className="text-right pb-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {citiesInCountry.map((city) => (
                                  <tr key={city.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-sm text-white">
                                      {city.cityName}
                                    </td>
                                    <td className="py-3 text-sm text-white/70">
                                      <div className="flex flex-wrap gap-1">
                                        {city.airports.length > 0 ? (
                                          city.airports.map((airport) => (
                                            <span
                                              key={airport.iataCode}
                                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                airport.isPrimary
                                                  ? 'bg-white/20 text-white'
                                                  : 'bg-white/10 text-white/70'
                                              }`}
                                              title={airport.name}
                                            >
                                              {airport.iataCode}
                                              {airport.isPrimary && ' ★'}
                                            </span>
                                          ))
                                        ) : city.airportCode ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
                                            {city.airportCode}
                                          </span>
                                        ) : (
                                          <span className="text-white/50">No airports</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 text-sm text-white/70">
                                      {city._count.themePOIs} POIs
                                    </td>
                                    <td className="py-3 text-right text-sm">
                                      <button
                                        onClick={() => openPOIModal(city.id)}
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
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {countries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No countries yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingCountry ? 'Edit Country' : 'Add Country'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Country Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="United States"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  ISO Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 uppercase"
                  placeholder="US"
                  maxLength={2}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-brand-purple rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  {editingCountry ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POI Modal */}
      {selectedDestination && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedDestination.cityName}{selectedDestination.country && `, ${selectedDestination.country.name}`}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    {selectedDestination.airportCode || 'No airport'} • {selectedDestination.themePOIs.length} total POIs
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

            {/* Instagram-style Video Feed */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {selectedDestination.themePOIs
                  .filter((p) => p.theme === activeTheme)
                  .map((poi) => (
                    <div key={poi.id} className="space-y-4">
                      {/* POI Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{poi.name}</h3>
                          {poi.description && (
                            <p className="text-white/60 text-sm mt-1 line-clamp-2">
                              {poi.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedPOI(poi)
                              setIsAddingVideos(true)
                            }}
                            className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Film className="w-4 h-4" />
                            Add Videos
                          </button>
                          <button
                            onClick={() => handleDeletePOI(poi.id)}
                            className="text-red-300 hover:text-red-200 text-sm transition-colors"
                          >
                            Delete POI
                          </button>
                        </div>
                      </div>

                      {/* Video Feed */}
                      {poi.videos && poi.videos.length > 0 ? (
                        <div className="space-y-4">
                          {poi.videos.map((video, videoIndex) => (
                            <VideoCard
                              key={video.id}
                              video={video}
                              poiName={poi.name}
                              poiDescription={poi.description}
                              onEdit={() => {
                                // TODO: Implement video URL editing
                              }}
                              onDelete={handleDeleteVideo}
                              onMoveUp={() => handleReorderVideo(video.id, 'up')}
                              onMoveDown={() => handleReorderVideo(video.id, 'down')}
                              canMoveUp={videoIndex > 0}
                              canMoveDown={videoIndex < (poi.videos?.length || 0) - 1}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10 border-dashed">
                          <Film className="w-12 h-12 text-white/30 mx-auto mb-2" />
                          <p className="text-white/50 text-sm">No videos yet for this POI</p>
                          <button
                            onClick={() => {
                              setSelectedPOI(poi)
                              setIsAddingVideos(true)
                            }}
                            className="mt-2 text-sm text-blue-300 hover:text-blue-200"
                          >
                            Add your first video →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                {selectedDestination.themePOIs.filter((p) => p.theme === activeTheme).length === 0 && !isAddingPOI && (
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

      {/* Add Videos Modal */}
      {isAddingVideos && selectedPOI && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                Add Videos to {selectedPOI.name}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                Paste YouTube Shorts URLs to add multiple videos at once
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AddVideosForm
                onSubmit={handleAddVideos}
                onCancel={() => {
                  setIsAddingVideos(false)
                  setSelectedPOI(null)
                }}
                isSubmitting={isSubmittingVideos}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
