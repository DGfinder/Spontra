'use client'

import { useState } from 'react'
import { X, Loader, PlusCircle } from 'lucide-react'

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

function parseUrls(input: string) {
  return input
    .split(/\r?\n|,|\s/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
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
  const [urlsText, setUrlsText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) return null

  const urls = parseUrls(urlsText)

  const handleSubmit = async () => {
    setError(null)
    const uniqueUrls = Array.from(new Set(urls))

    if (uniqueUrls.length < minRequired) {
      setError(Add at least  media URLs for .)
      return
    }
    if (uniqueUrls.length > maxAllowed) {
      setError(Limit is  URLs per submission.)
      return
    }

    const validation = normaliseMediaUrls(uniqueUrls)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(/api/admin/destinations//themes//reels, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validation.urls }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to create reels')
      }

      const json = await res.json()
      onCreated?.(Array.isArray(json?.data) ? json.data.length : validation.urls.length)
      setUrlsText('')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create reels')
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
            <h2 className="text-lg font-semibold text-gray-900">Add media for {iata} • {themeSlug}</h2>
            <p className="text-sm text-gray-600">Paste between {minRequired} and {maxAllowed} video/image URLs.</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <textarea
            value={urlsText}
            onChange={(event) => setUrlsText(event.target.value)}
            placeholder="https:// ..."
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{urls.length} URL(s) detected</span>
            <span>{minRequired} required • max {maxAllowed}</span>
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
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
                Saving…
              </>
            ) : (
              'Add Media'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
