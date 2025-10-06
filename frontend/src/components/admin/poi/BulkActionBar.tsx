'use client'

import { useState } from 'react'
import { Trash2, Tag, Edit3, X } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onBatchDelete: () => Promise<void>
  onBatchChangeTheme: (theme: string) => Promise<void>
  onBatchUpdateSEO: (template: string) => Promise<void>
  onClearSelection: () => void
  isProcessing?: boolean
}

const THEMES = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'beach', label: 'Beach' },
  { value: 'city', label: 'City' },
  { value: 'culture', label: 'Culture' },
  { value: 'food', label: 'Food' },
  { value: 'nature', label: 'Nature' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'shopping', label: 'Shopping' }
]

export function BulkActionBar({
  selectedCount,
  onBatchDelete,
  onBatchChangeTheme,
  onBatchUpdateSEO,
  onClearSelection,
  isProcessing = false
}: BulkActionBarProps) {
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showSEOMenu, setShowSEOMenu] = useState(false)
  const [seoTemplate, setSEOTemplate] = useState('')

  async function handleBatchDelete() {
    if (!confirm(`Delete ${selectedCount} POIs and all their videos? This cannot be undone.`)) {
      return
    }
    await onBatchDelete()
  }

  async function handleChangeTheme(theme: string) {
    setShowThemeMenu(false)
    await onBatchChangeTheme(theme)
  }

  async function handleUpdateSEO() {
    if (!seoTemplate.trim()) {
      alert('Please enter a caption template')
      return
    }
    setShowSEOMenu(false)
    await onBatchUpdateSEO(seoTemplate)
    setSEOTemplate('')
  }

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 border border-white/20 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">
            {selectedCount}
          </div>
          <span className="text-white font-medium">
            {selectedCount} {selectedCount === 1 ? 'POI' : 'POIs'} selected
          </span>
        </div>

        <div className="h-6 w-px bg-white/20" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Change Theme */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Tag className="w-4 h-4" />
              <span className="text-sm">Change Theme</span>
            </button>

            {showThemeMenu && (
              <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-white/20 rounded-lg shadow-xl py-2 min-w-[150px]">
                {THEMES.map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => handleChangeTheme(theme.value)}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors text-sm"
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Update SEO */}
          <div className="relative">
            <button
              onClick={() => setShowSEOMenu(!showSEOMenu)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm">Update SEO</span>
            </button>

            {showSEOMenu && (
              <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-white/20 rounded-lg shadow-xl p-4 min-w-[300px]">
                <label className="block text-white text-sm mb-2">
                  Caption Template
                </label>
                <input
                  type="text"
                  value={seoTemplate}
                  onChange={(e) => setSEOTemplate(e.target.value)}
                  placeholder="e.g., Explore {name} in {city}"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                />
                <div className="text-xs text-white/50 mt-1">
                  Use {'{name}'} for POI name
                </div>
                <button
                  onClick={handleUpdateSEO}
                  className="mt-3 w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  Apply to All
                </button>
              </div>
            )}
          </div>

          {/* Batch Delete */}
          <button
            onClick={handleBatchDelete}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Delete</span>
          </button>
        </div>

        <div className="h-6 w-px bg-white/20" />

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          disabled={isProcessing}
          className="text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
