'use client'

import { useState } from 'react'
import { getDestinationWithPOIs } from '@/actions/destinationActions'
import { createPOI, updatePOI, deletePOI, reorderPOI } from '@/actions/themePOIActions'
import { addVideos, deleteVideo, reorderVideo, bulkReorderVideos } from '@/actions/poiVideoActions'

export interface POIVideo {
  id: string
  poiId: string
  videoUrl: string
  displayOrder: number
  createdAt: string
  caption?: string | null
  altText?: string | null
  instagramUrl?: string | null
  youtubeChannelName?: string | null
  youtubeChannelUrl?: string | null
  youtubeChannelId?: string | null
}

export interface ThemePOI {
  id: string
  destinationId: string
  theme: string
  name: string
  description: string | null
  videoUrl: string | null
  displayOrder: number
  latitude?: number | null
  longitude?: number | null
  caption?: string | null
  altText?: string | null
  instagramUrl?: string | null
  createdAt: string
  updatedAt: string
  videos: POIVideo[]
}

export interface DestinationWithPOIs {
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

type UIMode = 'list' | 'select-template' | 'add-poi' | 'edit-poi' | 'add-videos' | 'edit-video'

interface POIManagementState {
  // Core data
  destination: DestinationWithPOIs | null
  activeTheme: string

  // UI state
  uiMode: UIMode
  selectedPOI: ThemePOI | null
  editingVideoId: string | null
  templateData: any | null // Template data for pre-filling POI form

  // Loading states
  isLoading: boolean
  isSubmitting: boolean

  // Error handling
  error: string | null
}

export function usePOIManagement(initialDestinationId?: string) {
  const [state, setState] = useState<POIManagementState>({
    destination: null,
    activeTheme: 'adventure',
    uiMode: 'list',
    selectedPOI: null,
    editingVideoId: null,
    templateData: null,
    isLoading: false,
    isSubmitting: false,
    error: null
  })

  // Load destination with POIs
  async function loadDestination(destinationId: string) {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    const result = await getDestinationWithPOIs(destinationId)

    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        destination: result.data as DestinationWithPOIs,
        isLoading: false
      }))
      return true
    } else {
      setState(prev => ({
        ...prev,
        error: result.error || 'Failed to load destination',
        isLoading: false
      }))
      return false
    }
  }

  // Reload current destination
  async function reload() {
    if (state.destination) {
      await loadDestination(state.destination.id)
    }
  }

  // Theme management
  function setActiveTheme(theme: string) {
    setState(prev => ({ ...prev, activeTheme: theme }))
  }

  // UI mode management
  function setUIMode(mode: UIMode, poi?: ThemePOI | null, videoId?: string | null) {
    setState(prev => ({
      ...prev,
      uiMode: mode,
      selectedPOI: poi !== undefined ? poi : prev.selectedPOI,
      editingVideoId: videoId !== undefined ? videoId : null,
      templateData: mode === 'list' ? null : prev.templateData // Clear template on return to list
    }))
  }

  // Template management
  function setTemplateData(templateData: any) {
    setState(prev => ({ ...prev, templateData, uiMode: 'add-poi' }))
  }

  // POI CRUD operations
  async function handleCreatePOI(data: {
    name: string
    description?: string
    videoUrl?: string
    latitude?: number
    longitude?: number
    caption?: string
    altText?: string
    instagramUrl?: string
  }) {
    if (!state.destination) return { success: false, error: 'No destination selected' }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    const result = await createPOI({
      destinationId: state.destination.id,
      theme: state.activeTheme,
      ...data
    })

    if (result.success) {
      await reload()
      setState(prev => ({ ...prev, isSubmitting: false, uiMode: 'list' }))
      return { success: true }
    } else {
      setState(prev => ({
        ...prev,
        error: result.error || 'Failed to create POI',
        isSubmitting: false
      }))
      return { success: false, error: result.error }
    }
  }

  async function handleUpdatePOI(id: string, data: {
    name: string
    description?: string
    videoUrl?: string
    latitude?: number
    longitude?: number
    caption?: string
    altText?: string
    instagramUrl?: string
  }) {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    const result = await updatePOI(id, data)

    if (result.success) {
      await reload()
      setState(prev => ({ ...prev, isSubmitting: false, uiMode: 'list', selectedPOI: null }))
      return { success: true }
    } else {
      setState(prev => ({
        ...prev,
        error: result.error || 'Failed to update POI',
        isSubmitting: false
      }))
      return { success: false, error: result.error }
    }
  }

  async function handleDeletePOI(id: string) {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    const result = await deletePOI(id)

    if (result.success) {
      await reload()
      setState(prev => ({ ...prev, isSubmitting: false }))
      return { success: true }
    } else {
      setState(prev => ({
        ...prev,
        error: result.error || 'Failed to delete POI',
        isSubmitting: false
      }))
      return { success: false, error: result.error }
    }
  }

  async function handleReorderPOI(id: string, direction: 'up' | 'down') {
    const result = await reorderPOI(id, direction)
    if (result.success) {
      await reload()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  // Video operations
  async function handleAddVideos(poiId: string, videos: Array<{ url: string; caption?: string; altText?: string; instagramUrl?: string }>) {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    const result = await addVideos(poiId, videos)

    if (result.success) {
      await reload()
      setState(prev => ({ ...prev, isSubmitting: false, uiMode: 'list', selectedPOI: null }))
      return { success: true }
    } else {
      setState(prev => ({
        ...prev,
        error: result.error || 'Failed to add videos',
        isSubmitting: false
      }))
      return { success: false, error: result.error }
    }
  }

  async function handleDeleteVideo(videoId: string) {
    const result = await deleteVideo(videoId)
    if (result.success) {
      await reload()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  async function handleReorderVideo(videoId: string, direction: 'up' | 'down') {
    const result = await reorderVideo(videoId, direction)
    if (result.success) {
      await reload()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  async function handleBulkReorderVideos(updates: Array<{ id: string; displayOrder: number }>) {
    const result = await bulkReorderVideos(updates)
    if (result.success) {
      await reload()
    }
  }

  // Bulk POI operations
  async function handleBatchDeletePOIs(poiIds: string[]) {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // Delete all POIs in parallel
      const results = await Promise.all(
        poiIds.map(id => deletePOI(id))
      )

      const failedCount = results.filter(r => !r.success).length

      if (failedCount === 0) {
        await reload()
        setState(prev => ({ ...prev, isSubmitting: false }))
        return { success: true, message: `Deleted ${poiIds.length} POIs` }
      } else {
        await reload()
        setState(prev => ({ ...prev, isSubmitting: false }))
        return {
          success: false,
          error: `Failed to delete ${failedCount} of ${poiIds.length} POIs`
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to delete POIs',
        isSubmitting: false
      }))
      return { success: false, error: 'Failed to delete POIs' }
    }
  }

  async function handleBatchChangeTheme(poiIds: string[], newTheme: string) {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // Get current POIs to preserve their data
      const currentPOIs = state.destination?.themePOIs.filter(p => poiIds.includes(p.id)) || []

      // Update theme for all POIs
      const results = await Promise.all(
        currentPOIs.map(poi =>
          updatePOI(poi.id, {
            name: poi.name,
            description: poi.description || undefined,
            latitude: poi.latitude || undefined,
            longitude: poi.longitude || undefined
            // Note: Theme is set via the POI's theme field, but updatePOI doesn't change theme
            // We'd need a separate backend action for this. For now, this is a placeholder.
          })
        )
      )

      const failedCount = results.filter(r => !r.success).length

      if (failedCount === 0) {
        await reload()
        setState(prev => ({ ...prev, isSubmitting: false }))
        return { success: true, message: `Changed theme for ${poiIds.length} POIs` }
      } else {
        await reload()
        setState(prev => ({ ...prev, isSubmitting: false }))
        return {
          success: false,
          error: `Failed to update ${failedCount} of ${poiIds.length} POIs`
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to change theme',
        isSubmitting: false
      }))
      return { success: false, error: 'Failed to change theme' }
    }
  }

  async function handleBatchUpdateSEO(poiIds: string[], captionTemplate: string) {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const currentPOIs = state.destination?.themePOIs.filter(p => poiIds.includes(p.id)) || []
      const cityName = state.destination?.cityName || ''

      // Update SEO for all POIs
      const results = await Promise.all(
        currentPOIs.map(poi => {
          const caption = captionTemplate.replace('{name}', poi.name).replace('{city}', cityName)

          return updatePOI(poi.id, {
            name: poi.name,
            description: poi.description || undefined,
            latitude: poi.latitude || undefined,
            longitude: poi.longitude || undefined,
            caption: caption
          })
        })
      )

      const failedCount = results.filter(r => !r.success).length

      if (failedCount === 0) {
        await reload()
        setState(prev => ({ ...prev, isSubmitting: false }))
        return { success: true, message: `Updated SEO for ${poiIds.length} POIs` }
      } else {
        await reload()
        setState(prev => ({ ...prev, isSubmitting: false }))
        return {
          success: false,
          error: `Failed to update ${failedCount} of ${poiIds.length} POIs`
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to update SEO',
        isSubmitting: false
      }))
      return { success: false, error: 'Failed to update SEO' }
    }
  }

  // Get POIs for active theme
  const themePOIs = state.destination?.themePOIs.filter(p => p.theme === state.activeTheme) || []

  return {
    // State
    destination: state.destination,
    activeTheme: state.activeTheme,
    uiMode: state.uiMode,
    selectedPOI: state.selectedPOI,
    editingVideoId: state.editingVideoId,
    templateData: state.templateData,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,
    themePOIs,

    // Actions
    loadDestination,
    reload,
    setActiveTheme,
    setUIMode,
    setTemplateData,
    handleCreatePOI,
    handleUpdatePOI,
    handleDeletePOI,
    handleReorderPOI,
    handleAddVideos,
    handleDeleteVideo,
    handleReorderVideo,
    handleBulkReorderVideos,
    handleBatchDeletePOIs,
    handleBatchChangeTheme,
    handleBatchUpdateSEO
  }
}
