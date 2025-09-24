'use client'

import { useEffect, useState } from 'react'
import { Loader } from 'lucide-react'

interface OverlayEditorDestination {
  airportCode: string
  city: string
  description: string
  highlights: string[]
  heroImage?: string | null
}

interface OverlayEditorModalProps {
  open: boolean
  destination: OverlayEditorDestination | null
  onClose: () => void
  onSaved: () => void
}

export default function OverlayEditorModal({ open, destination, onClose, onSaved }: OverlayEditorModalProps) {
  const [description, setDescription] = useState('')
  const [heroImage, setHeroImage] = useState('')
  const [highlightsText, setHighlightsText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!destination) return
    setDescription(destination.description ?? '')
    setHeroImage(destination.heroImage ?? '')
    setHighlightsText((destination.highlights ?? []).join('\n'))
    setError(null)
  }, [destination])

  if (!open || !destination) return null

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/destinations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airport_code: destination.airportCode,
          description,
          hero_image: heroImage || undefined,
          highlights: highlightsText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save destination')
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save destination')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close overlay editor"
        >
          ?
        </button>

        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit overview for {destination.city}</h2>
          <p className="text-sm text-gray-600">Update hero media and descriptive copy shown to curators.</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Hero image URL</label>
            <input
              value={heroImage}
              onChange={(event) => setHeroImage(event.target.value)}
              type="url"
              placeholder="https://cdn.spontra.com/media/..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Highlights (one per line)</label>
            <textarea
              value={highlightsText}
              onChange={(event) => setHighlightsText(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader className="mr-2 animate-spin" size={16} /> : null}
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
