'use client'

import { useState, useEffect } from 'react'
import { getDestinations, getDestinationWithPOIs } from '@/actions/destinationActions'
import { createPOI, updatePOI, deletePOI, reorderPOI } from '@/actions/themePOIActions'
import { addVideos, deleteVideo, reorderVideo } from '@/actions/poiVideoActions'
import { VideoCard } from '@/components/admin/VideoCard'
import { AddVideosForm } from '@/components/admin/AddVideosForm'
import { Film } from 'lucide-react'

interface Destination {
  id: string
  cityName: string
  airportCode: string | null
  country: {
    id: string
    name: string
    code: string
    createdAt: string
    updatedAt: string
  } | null
  airports: Array<{
    isPrimary: boolean
    createdAt: string
    airport: {
      iataCode: string
      name: string
    }
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
  createdAt: string
}

interface ThemePOI {
  id: string
  theme: string
  name: string
  description: string | null
  videoUrl: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
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

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDestination, setSelectedDestination] = useState<DestinationWithPOIs | null>(null)
  const [activeTheme, setActiveTheme] = useState('adventure')
  const [isAddingPOI, setIsAddingPOI] = useState(false)
  const [newPOI, setNewPOI] = useState({ name: '', description: '', videoUrl: '' })

  // Video management state
  const [selectedPOI, setSelectedPOI] = useState<ThemePOI | null>(null)
  const [isAddingVideos, setIsAddingVideos] = useState(false)
  const [isSubmittingVideos, setIsSubmittingVideos] = useState(false)

  useEffect(() => {
    loadDestinations()
  }, [])

  async function loadDestinations() {
    setIsLoading(true)
    const result = await getDestinations()
    console.log('[Destinations] Load result:', result)
    if (result.success && result.data) {
      console.log('[Destinations] Setting data:', result.data.length, 'destinations')
      setDestinations(result.data)
    } else {
      console.error('[Destinations] Failed to load:', result.error)
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
    setSelectedPOI(null)
    setIsAddingVideos(false)
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
      openPOIModal(selectedDestination.id)
    } else {
      alert(result.error)
    }
  }

  async function handleDeletePOI(poiId: string) {
    if (!confirm('Delete this POI and all its videos?')) return

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
                Airports
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
                <td className="px-6 py-4 text-sm text-white/70">
                  <div className="flex flex-wrap gap-1">
                    {dest.airports && dest.airports.length > 0 ? (
                      dest.airports.map((da) => (
                        <span
                          key={da.airport.iataCode}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            da.isPrimary
                              ? 'bg-white/20 text-white'
                              : 'bg-white/10 text-white/70'
                          }`}
                          title={da.airport.name}
                        >
                          {da.airport.iataCode}
                          {da.isPrimary && ' ★'}
                        </span>
                      ))
                    ) : dest.airportCode ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
                        {dest.airportCode}
                      </span>
                    ) : (
                      <span className="text-white/50">No airports</span>
                    )}
                  </div>
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

      {/* POI Modal with Video Feed */}
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
                    {selectedDestination.airportCode || 'No airport'} • {selectedDestination.themePOIs.length} POIs
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
            <div className="flex border-b border-white/10 px-6 overflow-x-auto">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => {
                    setActiveTheme(theme.value)
                    setSelectedPOI(null)
                    setIsAddingVideos(false)
                  }}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
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
              {/* POIs for this theme */}
              <div className="space-y-6">
                {themePOIs.map((poi) => (
                  <div key={poi.id} className="space-y-4">
                    {/* POI Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{poi.name}</h3>
                        {poi.description && (
                          <p className="text-white/60 text-sm mt-1">{poi.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
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
                          className="text-red-300 hover:text-red-200 text-sm"
                        >
                          Delete POI
                        </button>
                      </div>
                    </div>

                    {/* Video Feed for this POI */}
                    {poi.videos && poi.videos.length > 0 ? (
                      <div className="space-y-4">
                        {poi.videos.map((video, videoIndex) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            poiName={poi.name}
                            poiDescription={poi.description}
                            onEdit={() => {}} // TODO: Implement video URL editing
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
                        <p className="text-white/50 text-sm">No videos yet</p>
                        <button
                          onClick={() => {
                            setSelectedPOI(poi)
                            setIsAddingVideos(true)
                          }}
                          className="mt-3 text-blue-300 hover:text-blue-200 text-sm"
                        >
                          Add your first video →
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {themePOIs.length === 0 && !isAddingPOI && (
                  <p className="text-center text-white/50 py-12">
                    No POIs for this theme yet
                  </p>
                )}
              </div>

              {/* Add POI Form */}
              {isAddingPOI ? (
                <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-3">Add New POI</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="POI Name (e.g., Eiffel Tower)"
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
                        Create POI
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingPOI(true)}
                  className="mt-6 w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:text-white hover:border-white/40 transition-colors"
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
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Add Videos to "{selectedPOI.name}"
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Add multiple YouTube Shorts URLs for an Instagram-style feed
            </p>

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
      )}
    </div>
  )
}
