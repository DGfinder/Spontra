'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { usePOIManagement, type DestinationWithPOIs } from '@/lib/hooks/usePOIManagement'
import { POIList } from './POIList'
import { POIEditor } from './POIEditor'
import { VideoEditDialog } from './VideoEditDialog'
import { AddVideosForm } from '../AddVideosForm'
import { BulkActionBar } from './BulkActionBar'
import { POITemplates, type POITemplate } from './POITemplates'
import { ThemeInfoPanel } from './ThemeInfoPanel'
import { useToast } from '@/components/ui/Toast'
import { THEME_CONFIGS } from '@/lib/constants/themes'

const THEMES = THEME_CONFIGS.map(({ value, label, emoji }) => ({
  value,
  label,
  emoji
}))

interface ManagePOIModalProps {
  destinationId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ManagePOIModal({
  destinationId,
  isOpen,
  onClose,
  onSuccess
}: ManagePOIModalProps) {
  const poiManager = usePOIManagement()
  const toast = useToast()
  const [selectedPOIIds, setSelectedPOIIds] = useState<string[]>([])

  // Load destination when modal opens
  useEffect(() => {
    if (isOpen && destinationId) {
      poiManager.loadDestination(destinationId)
    }
  }, [isOpen, destinationId])

  // Clear selection when switching themes
  useEffect(() => {
    setSelectedPOIIds([])
  }, [poiManager.activeTheme])

  // Bulk operation handlers
  async function handleBatchDelete() {
    const result = await poiManager.handleBatchDeletePOIs(selectedPOIIds)
    if (result.success) {
      toast.success('POIs deleted', result.message || 'Selected POIs have been deleted')
      setSelectedPOIIds([])
    } else {
      toast.error('Delete failed', result.error || 'Failed to delete POIs')
    }
  }

  async function handleBatchChangeTheme(theme: string) {
    const result = await poiManager.handleBatchChangeTheme(selectedPOIIds, theme)
    if (result.success) {
      toast.success('Theme changed', result.message || 'Theme updated successfully')
      setSelectedPOIIds([])
    } else {
      toast.error('Update failed', result.error || 'Failed to change theme')
    }
  }

  async function handleBatchUpdateSEO(template: string) {
    const result = await poiManager.handleBatchUpdateSEO(selectedPOIIds, template)
    if (result.success) {
      toast.success('SEO updated', result.message || 'SEO metadata updated successfully')
      setSelectedPOIIds([])
    } else {
      toast.error('Update failed', result.error || 'Failed to update SEO')
    }
  }

  // Template selection handler
  function handleSelectTemplate(template: POITemplate) {
    const cityName = poiManager.destination?.cityName || 'this destination'

    // Replace placeholders in template data
    const templateData = {
      ...template.defaultData,
      caption: template.defaultData.caption.replace('{city}', cityName),
      altText: template.defaultData.altText
    }

    poiManager.setTemplateData(templateData)
  }

  if (!isOpen || !poiManager.destination) return null

  const handleClose = () => {
    poiManager.setUIMode('list', null, null)
    onClose()
    onSuccess?.()
  }

  const themeColor = THEMES.find(t => t.value === poiManager.activeTheme)?.value || '#FFC83A'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Main Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                   w-full max-w-7xl max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="poi-modal-title"
      >
        <div className="bg-[rgba(11,15,18,0.95)] backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl m-4 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="poi-modal-title"
                  className="text-2xl font-bold text-white"
                >
                  {poiManager.destination.cityName}
                  {poiManager.destination.country && `, ${poiManager.destination.country.name}`}
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  {poiManager.destination.airportCode || 'No airport'} • {poiManager.destination.themePOIs.length} POIs
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Theme Tabs */}
          <div className="flex border-b border-white/10 px-6 overflow-x-auto shrink-0">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                onClick={() => {
                  poiManager.setActiveTheme(theme.value)
                  poiManager.setUIMode('list', null)
                }}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  poiManager.activeTheme === theme.value
                    ? 'text-white border-white'
                    : 'text-white/60 border-transparent hover:text-white/80'
                }`}
              >
                {theme.emoji} {theme.label}
              </button>
            ))}
          </div>

          {/* Content Area - Two Column Layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6 p-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 overflow-y-auto lg:w-2/3">
              {poiManager.uiMode === 'list' && (
                <POIList
                  pois={poiManager.themePOIs}
                  onAddPOI={() => poiManager.setUIMode('select-template')}
                  onEditPOI={(poi) => poiManager.setUIMode('edit-poi', poi)}
                  onDeletePOI={poiManager.handleDeletePOI}
                  onReorderPOI={poiManager.handleReorderPOI}
                  onAddVideos={(poi) => poiManager.setUIMode('add-videos', poi)}
                  onEditVideo={(videoId, poi) => {
                    poiManager.setUIMode('edit-video', poi, videoId)
                  }}
                  onDeleteVideo={poiManager.handleDeleteVideo}
                  onReorderVideo={poiManager.handleReorderVideo}
                  onBulkReorderVideos={poiManager.handleBulkReorderVideos}
                  isLoading={poiManager.isSubmitting}
                  selectedPOIIds={selectedPOIIds}
                  onSelectionChange={setSelectedPOIIds}
                />
              )}

              {poiManager.uiMode === 'select-template' && (
                <POITemplates
                  theme={poiManager.activeTheme}
                  onSelectTemplate={handleSelectTemplate}
                  onCancel={() => poiManager.setUIMode('list', null)}
                />
              )}

              {(poiManager.uiMode === 'add-poi' || poiManager.uiMode === 'edit-poi') && (
                <POIEditor
                  poi={poiManager.selectedPOI}
                  templateData={poiManager.templateData}
                  onSubmit={async (data) => {
                    if (poiManager.uiMode === 'add-poi') {
                      return await poiManager.handleCreatePOI(data)
                    } else if (poiManager.selectedPOI) {
                      return await poiManager.handleUpdatePOI(poiManager.selectedPOI.id, data)
                    }
                    return { success: false, error: 'Invalid operation' }
                  }}
                  onCancel={() => poiManager.setUIMode('list', null)}
                  isSubmitting={poiManager.isSubmitting}
                />
              )}
            </div>

            {/* Right Column - Theme Info Panel */}
            <div className="hidden lg:block lg:w-1/3 shrink-0">
              <ThemeInfoPanel
                theme={poiManager.activeTheme}
                uiMode={poiManager.uiMode}
                selectedPOI={poiManager.selectedPOI}
                selectedCount={selectedPOIIds.length}
                cityName={poiManager.destination?.cityName}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Videos Modal (nested) */}
      {poiManager.uiMode === 'add-videos' && poiManager.selectedPOI && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Add Videos to "{poiManager.selectedPOI.name}"
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Add multiple YouTube Shorts URLs for an Instagram-style feed
            </p>

            <AddVideosForm
              onSubmit={async (videoUrls) => {
                if (poiManager.selectedPOI) {
                  await poiManager.handleAddVideos(poiManager.selectedPOI.id, videoUrls)
                }
              }}
              onCancel={() => poiManager.setUIMode('list', null)}
              isSubmitting={poiManager.isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Video Edit Modal (nested) */}
      {poiManager.uiMode === 'edit-video' && poiManager.editingVideoId && (() => {
        const video = poiManager.selectedPOI?.videos.find(v => v.id === poiManager.editingVideoId)
        return (
          <VideoEditDialog
            videoId={poiManager.editingVideoId}
            currentUrl={video?.videoUrl || ''}
            currentChannelName={video?.youtubeChannelName}
            currentChannelUrl={video?.youtubeChannelUrl}
            currentChannelId={video?.youtubeChannelId}
            onClose={() => poiManager.setUIMode('list', null, null)}
            onUpdate={async () => {
              await poiManager.reload()
            }}
          />
        )
      })()}

      {/* Bulk Action Bar (floats at bottom) */}
      {poiManager.uiMode === 'list' && (
        <BulkActionBar
          selectedCount={selectedPOIIds.length}
          onBatchDelete={handleBatchDelete}
          onBatchChangeTheme={handleBatchChangeTheme}
          onBatchUpdateSEO={handleBatchUpdateSEO}
          onClearSelection={() => setSelectedPOIIds([])}
          isProcessing={poiManager.isSubmitting}
        />
      )}
    </>
  )
}
