'use client'

import { useEffect, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, X, ChevronUp, Bookmark, Plane, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useFeedStore, FeedDestination } from '@/store/feedStore'
import { SwipeCard } from './SwipeCard'
import { getThemeColor, type ThemeKey } from '@/lib/theme'

interface SwipeFeedProps {
  origin: string
  theme: string
  maxFlightMinutes?: number
}

const PREFETCH_AHEAD = 3   // keep 3 cards loaded ahead

export function SwipeFeed({ origin, theme, maxFlightMinutes = 360 }: SwipeFeedProps) {
  const {
    items, cursor, isLoading, isFetchingMore,
    setFeed, appendFeed, advance, saveItem, skipItem,
    setLoading, setFetchingMore,
  } = useFeedStore()

  const [actionFlash, setActionFlash] = useState<'save' | 'skip' | 'up' | null>(null)

  const themeColor = getThemeColor(theme as ThemeKey)

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!origin || !theme) return
    loadFeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, theme])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/feed?origin=${origin}&theme=${theme}&maxFlightMinutes=${maxFlightMinutes}&limit=20`
      )
      const data = await res.json()
      if (data.ok) {
        const mapped = mapItems(data.data)
        setFeed(mapped, origin, theme)
      }
    } finally {
      setLoading(false)
    }
  }, [origin, theme, maxFlightMinutes, setFeed, setLoading])

  // ── Pre-fetch more when getting close to the end ───────────────────────
  useEffect(() => {
    const remaining = items.length - cursor
    if (remaining <= PREFETCH_AHEAD && !isFetchingMore && items.length > 0) {
      prefetchMore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, items.length])

  const prefetchMore = async () => {
    setFetchingMore(true)
    try {
      const res = await fetch(
        `/api/feed?origin=${origin}&theme=${theme}&maxFlightMinutes=${maxFlightMinutes}&limit=10`
      )
      const data = await res.json()
      if (data.ok) appendFeed(mapItems(data.data))
    } finally {
      setFetchingMore(false)
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────
  const handleSave = useCallback((item: FeedDestination) => {
    saveItem(item)
    setActionFlash('save')
    setTimeout(() => setActionFlash(null), 600)
    advance()
    toast.success(`${item.cityName} saved!`, {
      description: 'Find it in your saved destinations ❤️',
      duration: 2500,
    })
  }, [saveItem, advance])

  const handleSkip = useCallback((iata: string) => {
    skipItem(iata)
    setActionFlash('skip')
    setTimeout(() => setActionFlash(null), 600)
    advance()
  }, [skipItem, advance])

  const handleUp = useCallback(() => {
    setActionFlash('up')
    setTimeout(() => setActionFlash(null), 400)
    advance()
  }, [advance])

  // ── Visible stack (current + next 2) ──────────────────────────────────
  const stack = items.slice(cursor, cursor + 3)
  const currentItem = items[cursor]

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/50">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-t-transparent"
          style={{ borderColor: `${themeColor}66`, borderTopColor: themeColor }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
        <span className="text-sm tracking-widest uppercase">Finding destinations</span>
      </div>
    )
  }

  // ── Empty ──────────────────────────────────────────────────────────────
  if (stack.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-white px-8 text-center">
        <span className="text-5xl">✈️</span>
        <h3 className="text-2xl font-black">You've seen them all</h3>
        <p className="text-white/50 text-sm">Try a different theme or extend your flight time.</p>
        <button
          onClick={loadFeed}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold"
          style={{ backgroundColor: themeColor, color: '#000' }}
        >
          <RotateCcw size={16} />
          Reload feed
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative flex flex-col">

      {/* ── Card stack ──────────────────────────────────────────────── */}
      <div className="relative flex-1 mx-4 mt-4" style={{ marginBottom: 80 }}>
        <AnimatePresence mode="popLayout">
          {stack.map((item, i) => (
            <SwipeCard
              key={`${item.iata}-${cursor + i}`}
              item={item}
              isTop={i === 0}
              offset={i}
              onSwipeUp={handleUp}
              onSwipeRight={() => handleSave(item)}
              onSwipeLeft={() => handleSkip(item.iata)}
            />
          ))}
        </AnimatePresence>

        {/* Action flash overlay */}
        <AnimatePresence>
          {actionFlash && (
            <motion.div
              className="absolute inset-0 rounded-3xl pointer-events-none z-50"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                backgroundColor:
                  actionFlash === 'save' ? '#22c55e33' :
                  actionFlash === 'skip' ? '#ef444433' :
                  '#ffffff11',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Action buttons ───────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-6">
        {/* Skip */}
        <button
          onClick={() => currentItem && handleSkip(currentItem.iata)}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:bg-red-500/30 hover:text-red-400 transition-all active:scale-90"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        {/* Next (up) */}
        <button
          onClick={handleUp}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:bg-white/20 transition-all active:scale-90"
        >
          <ChevronUp size={24} strokeWidth={2.5} />
        </button>

        {/* Save */}
        <button
          onClick={() => currentItem && handleSave(currentItem)}
          className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all active:scale-90"
          style={{ backgroundColor: `${themeColor}33`, borderColor: `${themeColor}66`, color: themeColor }}
        >
          <Heart size={22} />
        </button>

        {/* Book flights (if saved) */}
        {currentItem?.estimatedPrice && (
          <button
            onClick={() => {
              const p = new URLSearchParams({
                origin,
                destination: currentItem.iata,
                passengers: '1',
                class: 'ECONOMY',
              })
              window.open(`/api/book?${p}`, '_blank')
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: themeColor, color: '#000' }}
          >
            <Plane size={16} />
            Book
          </button>
        )}
      </div>

      {/* ── Progress dots ────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 flex flex-col gap-1">
        {Array.from({ length: Math.min(items.length - cursor, 5) }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-300"
            style={{
              height: i === 0 ? 20 : 6,
              backgroundColor: i === 0 ? themeColor : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Map API response → FeedDestination ────────────────────────────────────
function mapItems(data: any[]): FeedDestination[] {
  return data.map((item) => ({
    id: item.id,
    iata: item.destination.iata,
    cityName: item.destination.cityName,
    countryName: item.destination.countryName,
    countryCode: item.destination.countryCode,
    themeSlug: item.theme,
    imageUrl: item.reel.media?.find((m: any) => m.kind === 'image')?.sourceUrl
      ?? `https://source.unsplash.com/800x1200/?${encodeURIComponent(item.destination.cityName)},travel`,
    videoUrl: item.reel.media?.find((m: any) => m.kind === 'video')?.sourceUrl,
    caption: item.reel.caption,
    flightDurationMinutes: item.destination.flightDurationMinutes,
    estimatedPrice: item.destination.estimatedPrice,
    currency: item.destination.currency ?? 'AUD',
  }))
}
