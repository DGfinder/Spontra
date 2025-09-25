"use client"

import { useMemo, useState } from 'react'
import { Loader, PlusCircle, X } from 'lucide-react'

import { normaliseMediaUrls } from '@/lib/mediaValidation'

export type DestinationThemeSlug = 'vibe' | 'adventure' | 'discover' | 'indulge' | 'nature'

interface AddReelDialogProps {
  open: boolean
  iata: string
  themeSlug: DestinationThemeSlug
  minRequired?: number
  maxAllowed?: number
  onClose: () => void
  onCreated?: (count: number) => void
}

const parseUrls = (input: string) =>
  input
    .split(/\r?\n|,|\s/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

const THEME_LABELS: Record<DestinationThemeSlug, string> = {
  vibe: 'Vibe',
  adventure: 'Adventure',
  discover: 'Discover',
  indulge: 'Indulge',
  nature: 'Nature',
}

export default function AddReelDialog({
  open,
  iata,
  themeSlug,
  minRequired = 5,
  maxAllowed = 10,
  onClose,
  onCreated,
}: AddReelDialogProps) {
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const urls = useMemo(() => parseUrls(rawText), [rawText])

  if (!open) return null

  const handleSubmit = async () => {
    setError(null)

    if (urls.length < minRequired) {
      setError(`Add at least ${minRequired} media URL${minRequired === 1 ? '' : 's'} for ${THEME_LABELS[themeSlug]}.`)
      return
    }
    if (urls.length > maxAllowed) {
      setError(`Limit is ${maxAllowed} URLs per submission.`)
      return
    }

    const validation = normaliseMediaUrls(urls)
    if (!validation.ok) {
      setError(validation.error ?? 'Invalid media URLs')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/admin/destinations/${encodeURIComponent(iata)}/themes/${themeSlug}/reels`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: validation.urls }),
        },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to create reels')
      }

      const json = await response.json()
      const createdCount = Array.isArray(json?.data) ? json.data.length : validation.urls.length
      onCreated?.(createdCount)
      setRawText('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reels')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-xl rounded-xl bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close add reels dialog"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
          <PlusCircle className="text-blue-600" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add media for {iata} — {THEME_LABELS[themeSlug]}</h2>
            <p className="text-sm text-gray-600">Paste between {minRequired} and {maxAllowed} video or image URLs.</p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="https://cdn.example.com/media/..."
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{urls.length} URL(s) detected</span>
            <span>{minRequired} required — max {maxAllowed}</span>
          </div>

          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader className="mr-2 animate-spin" size={16} />
                Saving...
              </>
            ) : (
              'Add media'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
