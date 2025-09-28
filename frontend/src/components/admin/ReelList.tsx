"use client"

import { useCallback, useEffect, useState } from 'react'
import { Loader, ToggleLeft, ToggleRight } from 'lucide-react'

import type { DestinationThemeSlug } from '@/components/admin/AddReelDialog'
import { useToast } from '@/components/Toast'

interface ReelMedia {
  id: number
  sourceUrl: string
  kind: 'video' | 'image'
  isActive: boolean
  sortOrder: number
  altText?: string | null
  credit?: string | null
  license?: string | null
}

interface ReelItem {
  id: number
  iata: string
  themeSlug: DestinationThemeSlug
  title?: string | null
  caption?: string | null
  language?: string | null
  isActive: boolean
  sortOrder: number
  media: ReelMedia[]
}

interface ReelListProps {
  iata: string
  themeSlug: DestinationThemeSlug
  onChange?: () => void
}

export default function ReelList({ iata, themeSlug, onChange }: ReelListProps) {
  const { addToast } = useToast()
  const [reels, setReels] = useState<ReelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingMedia, setUpdatingMedia] = useState<number | null>(null)

  const loadReels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/destinations/${encodeURIComponent(iata)}/themes/${themeSlug}/reels`, { cache: 'no-store' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load reels')
      }
      const items: ReelItem[] = Array.isArray(payload?.data) ? payload.data : []
      setReels(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reels')
    } finally {
      setLoading(false)
    }
  }, [iata, themeSlug])

  useEffect(() => {
    loadReels()
  }, [loadReels])

  const handleToggleMedia = async (media: ReelMedia) => {
    setUpdatingMedia(media.id)
    try {
      const response = await fetch(`/api/admin/reel-media/${media.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !media.isActive }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update media')
      }
      addToast({ type: 'success', title: 'Media updated', message: `Media ${media.id} ${media.isActive ? 'disabled' : 'enabled'}.` })
      await loadReels()
      onChange?.()
    } catch (err) {
      addToast({ type: 'error', title: 'Update failed', message: err instanceof Error ? err.message : 'Unable to update media.' })
    } finally {
      setUpdatingMedia(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white/5 p-4 text-sm text-white/70">
        <Loader size={16} className="animate-spin" /> Loading reels...
      </div>
    )
  }

  if (error) {
    return <div className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-100">{error}</div>
  }

  if (reels.length === 0) {
    return <div className="rounded-lg border border-slate-200 bg-white/5 p-4 text-sm text-white/70">No reels have been added for this theme yet.</div>
  }

  return (
    <div className="space-y-3">
      {reels.map((reel) => (
        <div key={reel.id} className="rounded-lg border border-white/15 bg-black/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Reel #{reel.id}</p>
              {reel.title ? <p className="text-xs text-white/70">{reel.title}</p> : null}
              {reel.caption ? <p className="text-xs text-white/50">{reel.caption}</p> : null}
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">Order {reel.sortOrder}</span>
          </div>

          <div className="mt-3 space-y-2">
            {reel.media.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-white/10 bg-black/40 p-2 text-xs">
                <div className="space-y-1 text-white/80">
                  <p>
                    <span className="font-medium">Media #{item.id}</span> / {item.kind.toUpperCase()}
                  </p>
                  <p className="truncate text-white/60">{item.sourceUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleMedia(item)}
                  disabled={updatingMedia === item.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    item.isActive ? 'border-emerald-400/40 text-emerald-300' : 'border-white/20 text-white/60'
                  } disabled:opacity-50`}
                >
                  {updatingMedia === item.id ? (
                    <Loader size={14} className="animate-spin" />
                  ) : item.isActive ? (
                    <>
                      <ToggleRight size={14} /> Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={14} /> Inactive
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
