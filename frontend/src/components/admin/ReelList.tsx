'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Loader, Plus, Video, ImageIcon } from 'lucide-react'

import AddMediaDialog from '@/components/admin/AddMediaDialog'
import AddReelDialog, { DestinationThemeSlug } from '@/components/admin/AddReelDialog'

interface ReelMedia {
  id: number
  reelId: number
  kind: 'video' | 'image'
  sourceUrl: string
  providerId?: string | null
  aspect: string
  durationMs?: number | null
  width?: number | null
  height?: number | null
  altText?: string | null
  credit?: string | null
  license?: string | null
  sortOrder: number
  isActive: boolean
}

interface Reel {
  id: number
  iata: string
  themeSlug: DestinationThemeSlug
  title?: string | null
  caption?: string | null
  language: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  media: ReelMedia[]
}

interface ReelListProps {
  iata: string
  themeSlug: DestinationThemeSlug
}

export default function ReelList({ iata, themeSlug }: ReelListProps) {
  const [reels, setReels] = useState<Reel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [mediaDialogReel, setMediaDialogReel] = useState<Reel | null>(null)

  const loadReels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/admin/destinations/${encodeURIComponent(iata)}/themes/${themeSlug}/reels`,
        { cache: 'no-store' }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to load reels')
      }
      const json = await response.json()
      setReels(json?.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reels')
    } finally {
      setIsLoading(false)
    }
  }, [iata, themeSlug])

  useEffect(() => {
    loadReels()
  }, [loadReels])

  const handleToggleActive = async (reel: Reel, nextValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/reels/${reel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextValue }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to update reel')
      }
      setReels((prev) => prev.map((item) => (item.id === reel.id ? { ...item, isActive: nextValue } : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reel')
    }
  }

  const persistSortOrder = async (ordered: Reel[]) => {
    for (let index = 0; index < ordered.length; index += 1) {
      const reel = ordered[index]
      await fetch(`/api/admin/reels/${reel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: index }),
      })
    }
  }

  const handleMove = (reel: Reel, direction: 'up' | 'down') => {
    setError(null)
    setReels((prev) => {
      const index = prev.findIndex((item) => item.id === reel.id)
      if (index < 0) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev

      const copy = [...prev]
      const [removed] = copy.splice(index, 1)
      copy.splice(targetIndex, 0, removed)
      persistSortOrder(copy).catch((err) => setError(err instanceof Error ? err.message : 'Failed to reorder reels'))
      return copy
    })
  }

  const handleUpdateField = async (reel: Reel, field: 'title' | 'caption', value: string | null) => {
    try {
      await fetch(`/api/admin/reels/${reel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      setReels((prev) => prev.map((item) => (item.id === reel.id ? { ...item, [field]: value } : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reel')
    }
  }

  const totalMedia = useMemo(() => reels.reduce((sum, reel) => sum + reel.media.length, 0), [reels])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader className="animate-spin" size={16} /> Loading reels…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{themeSlug} reels</h3>
          <p className="text-sm text-gray-600">{reels.length} reel(s) • {totalMedia} media asset(s)</p>
        </div>
        <button
          onClick={() => setAddDialogOpen(true)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} className="mr-1" /> Add reels
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {reels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No media yet. Add at least five URLs to enable this theme.
        </div>
      ) : (
        <div className="space-y-3">
          {reels.map((reel, index) => (
            <div key={reel.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      #{reel.sortOrder}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={reel.isActive}
                        onChange={(event) => handleToggleActive(reel, event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Active</span>
                    </label>
                  </div>
                  <div>
                    <input
                      defaultValue={reel.title ?? ''}
                      placeholder="Optional title"
                      onBlur={(event) => handleUpdateField(reel, 'title', event.target.value.trim() || null)}
                      className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <textarea
                      defaultValue={reel.caption ?? ''}
                      placeholder="Optional caption"
                      onBlur={(event) => handleUpdateField(reel, 'caption', event.target.value.trim() || null)}
                      rows={2}
                      className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-sm text-gray-600">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMove(reel, 'up')}
                      disabled={index === 0}
                      className="inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:opacity-40"
                    >
                      <ArrowUp size={14} className="mr-1" /> Up
                    </button>
                    <button
                      onClick={() => handleMove(reel, 'down')}
                      disabled={index === reels.length - 1}
                      className="inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:opacity-40"
                    >
                      <ArrowDown size={14} className="mr-1" /> Down
                    </button>
                    <button
                      onClick={() => setMediaDialogReel(reel)}
                      className="inline-flex items-center rounded border border-blue-500 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Add media
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reel.media.map((media) => (
                      <span
                        key={media.id}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                      >
                        {media.kind === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                        {media.kind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddReelDialog
        open={addDialogOpen}
        iata={iata}
        themeSlug={themeSlug}
        onClose={() => setAddDialogOpen(false)}
        onCreated={() => loadReels()}
      />

      <AddMediaDialog
        open={Boolean(mediaDialogReel)}
        reelId={mediaDialogReel?.id ?? 0}
        onClose={() => setMediaDialogReel(null)}
        onCreated={() => loadReels()}
      />
    </div>
  )
}
