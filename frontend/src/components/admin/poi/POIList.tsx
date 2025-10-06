'use client'

import { useState, useMemo } from 'react'
import { Film, Edit2, Trash2, ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import { SortableVideoList } from './SortableVideoList'
import { useToast } from '@/components/ui/Toast'
import type { ThemePOI } from '@/lib/hooks/usePOIManagement'

interface POIListProps {
  pois: ThemePOI[]
  onAddPOI: () => void
  onEditPOI: (poi: ThemePOI) => void
  onDeletePOI: (poiId: string) => Promise<{ success: boolean; error?: string | undefined }>
  onReorderPOI: (poiId: string, direction: 'up' | 'down') => Promise<{ success: boolean; error?: string | undefined }>
  onAddVideos: (poi: ThemePOI) => void
  onEditVideo: (videoId: string, poi: ThemePOI) => void
  onDeleteVideo: (videoId: string) => Promise<{ success: boolean; error?: string | undefined }>
  onReorderVideo: (videoId: string, direction: 'up' | 'down') => Promise<{ success: boolean; error?: string | undefined }>
  onBulkReorderVideos: (updates: Array<{ id: string; displayOrder: number }>) => Promise<void>
  isLoading?: boolean
  selectedPOIIds?: string[]
  onSelectionChange?: (poiIds: string[]) => void
}

export function POIList({
  pois,
  onAddPOI,
  onEditPOI,
  onDeletePOI,
  onReorderPOI,
  onAddVideos,
  onEditVideo,
  onDeleteVideo,
  onReorderVideo,
  onBulkReorderVideos,
  isLoading = false,
  selectedPOIIds = [],
  onSelectionChange
}: POIListProps) {
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    hasVideos: false,
    hasCoordinates: false,
    needsSEO: false
  })

  // Filtered POIs based on search and filters
  const filteredPOIs = useMemo(() => {
    return pois.filter(poi => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = searchQuery === '' ||
        poi.name.toLowerCase().includes(searchLower) ||
        (poi.description?.toLowerCase().includes(searchLower) ?? false)

      // Has videos filter
      const matchesVideoFilter = !filters.hasVideos || (poi.videos && poi.videos.length > 0)

      // Has coordinates filter
      const matchesCoordFilter = !filters.hasCoordinates || (poi.latitude !== null && poi.longitude !== null)

      // Needs SEO filter (missing caption or altText)
      const matchesSEOFilter = !filters.needsSEO || (!poi.caption || !poi.altText)

      return matchesSearch && matchesVideoFilter && matchesCoordFilter && matchesSEOFilter
    })
  }, [pois, searchQuery, filters])

  // Selection helpers
  const selectionEnabled = !!onSelectionChange
  const allFilteredSelected = selectionEnabled && filteredPOIs.length > 0 &&
    filteredPOIs.every(poi => selectedPOIIds.includes(poi.id))

  function togglePOISelection(poiId: string) {
    if (!onSelectionChange) return

    if (selectedPOIIds.includes(poiId)) {
      onSelectionChange(selectedPOIIds.filter(id => id !== poiId))
    } else {
      onSelectionChange([...selectedPOIIds, poiId])
    }
  }

  function toggleAllFiltered() {
    if (!onSelectionChange) return

    if (allFilteredSelected) {
      // Deselect all filtered POIs
      const filteredIds = filteredPOIs.map(p => p.id)
      onSelectionChange(selectedPOIIds.filter(id => !filteredIds.includes(id)))
    } else {
      // Select all filtered POIs
      const newIds = filteredPOIs.map(p => p.id)
      const combined = [...new Set([...selectedPOIIds, ...newIds])]
      onSelectionChange(combined)
    }
  }

  async function handleDeletePOI(poiId: string, poiName: string) {
    if (!confirm(`Delete "${poiName}" and all its videos? This cannot be undone.`)) return

    const result = await onDeletePOI(poiId)
    if (!result.success && result.error) {
      toast.error('Failed to delete POI', result.error)
    } else if (result.success) {
      toast.success('POI deleted', `"${poiName}" has been removed`)
    }
  }

  async function handleDeleteVideo(videoId: string) {
    if (!confirm('Delete this video? This cannot be undone.')) return

    const result = await onDeleteVideo(videoId)
    if (!result.success && result.error) {
      toast.error('Failed to delete video', result.error)
    } else if (result.success) {
      toast.success('Video deleted', 'Video has been removed')
    }
  }

  if (pois.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-center text-white/50 py-12">
          No POIs for this theme yet
        </p>
        <button
          onClick={onAddPOI}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:text-white hover:border-white/40 transition-colors"
          disabled={isLoading}
        >
          + Add First POI
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search POIs by name or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {/* Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/40 mr-2">Filters:</span>

          <button
            onClick={() => setFilters(f => ({ ...f, hasVideos: !f.hasVideos }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filters.hasVideos
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Has Videos
          </button>

          <button
            onClick={() => setFilters(f => ({ ...f, hasCoordinates: !f.hasCoordinates }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filters.hasCoordinates
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Has Coordinates
          </button>

          <button
            onClick={() => setFilters(f => ({ ...f, needsSEO: !f.needsSEO }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filters.needsSEO
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Needs SEO
          </button>

          {(searchQuery || filters.hasVideos || filters.hasCoordinates || filters.needsSEO) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ hasVideos: false, hasCoordinates: false, needsSEO: false })
              }}
              className="ml-auto text-xs text-white/60 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Results count */}
        {filteredPOIs.length !== pois.length && (
          <p className="text-xs text-white/50">
            Showing {filteredPOIs.length} of {pois.length} POIs
          </p>
        )}
      </div>

      {/* Bulk Selection Toggle */}
      {selectionEnabled && filteredPOIs.length > 0 && (
        <div className="flex items-center gap-2 pb-2">
          <label className="flex items-center gap-2 text-sm text-white/70 hover:text-white cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span>
              {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filteredPOIs.length})
            </span>
          </label>
          {selectedPOIIds.length > 0 && (
            <span className="text-xs text-blue-300">
              {selectedPOIIds.length} selected
            </span>
          )}
        </div>
      )}

      {/* POI Cards */}
      {filteredPOIs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/50">No POIs match your search criteria</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setFilters({ hasVideos: false, hasCoordinates: false, needsSEO: false })
            }}
            className="mt-3 text-blue-300 hover:text-blue-200 text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        filteredPOIs.map((poi, poiIndex) => {
          const isSelected = selectedPOIIds.includes(poi.id)

          return (
        <div
          key={poi.id}
          className={`space-y-4 rounded-lg p-4 transition-colors ${
            isSelected ? 'bg-blue-500/10 ring-2 ring-blue-500/50' : 'bg-transparent'
          }`}
        >
          {/* POI Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Selection Checkbox */}
              {selectionEnabled && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePOISelection(poi.id)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-medium truncate">{poi.name}</h3>
                {poi.latitude && poi.longitude && (
                  <span className="text-xs text-white/40">
                    ({poi.latitude.toString().slice(0, 6)}, {poi.longitude.toString().slice(0, 6)})
                  </span>
                )}
              </div>
              {poi.description && (
                <p className="text-white/60 text-sm mt-1 line-clamp-2">
                  {poi.description}
                </p>
              )}
              {poi.caption && (
                <p className="text-white/50 text-xs mt-1 italic line-clamp-1">
                  Caption: {poi.caption}
                </p>
              )}
            </div>
            </div>

            {/* POI Actions */}
            <div className="flex items-center gap-2 ml-4">
              {/* Reorder buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onReorderPOI(poi.id, 'up')}
                  disabled={poiIndex === 0 || isLoading}
                  className="p-1 text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onReorderPOI(poi.id, 'down')}
                  disabled={poiIndex === pois.length - 1 || isLoading}
                  className="p-1 text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onEditPOI(poi)}
                className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                disabled={isLoading}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit POI
              </button>

              <button
                onClick={() => onAddVideos(poi)}
                className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                disabled={isLoading}
              >
                <Film className="w-4 h-4" />
                Add Videos
              </button>

              <button
                onClick={() => handleDeletePOI(poi.id, poi.name)}
                className="text-red-300 hover:text-red-200 text-sm transition-colors"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Feed for this POI */}
          {poi.videos && poi.videos.length > 0 ? (
            <SortableVideoList
              videos={poi.videos}
              poiName={poi.name}
              poiDescription={poi.description}
              onEdit={(videoId) => onEditVideo(videoId, poi)}
              onDelete={handleDeleteVideo}
              onReorder={onBulkReorderVideos}
            />
          ) : (
            <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10 border-dashed">
              <Film className="w-12 h-12 text-white/30 mx-auto mb-2" />
              <p className="text-white/50 text-sm">No videos yet for this POI</p>
              <button
                onClick={() => onAddVideos(poi)}
                className="mt-3 text-blue-300 hover:text-blue-200 text-sm"
                disabled={isLoading}
              >
                Add your first video →
              </button>
            </div>
          )}
        </div>
          )
        })
      )}

      {/* Add New POI Button */}
      <button
        onClick={onAddPOI}
        className="w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:text-white hover:border-white/40 transition-colors"
        disabled={isLoading}
      >
        + Add New POI
      </button>
    </div>
  )
}
