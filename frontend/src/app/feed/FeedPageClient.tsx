'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { SwipeFeed } from '@/components/feed/SwipeFeed'
import { useFeedStore } from '@/store/feedStore'
import { getThemeColor, type ThemeKey } from '@/lib/theme'

export function FeedPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const origin = searchParams.get('origin') || 'SYD'
  const theme  = searchParams.get('theme')  || 'adventure'
  const maxMin = Number(searchParams.get('maxFlightMinutes') || '360')

  const savedCount = useFeedStore(s => s.saved.length)
  const themeColor = getThemeColor(theme as ThemeKey)

  return (
    <div className="h-full w-full relative flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-14 pb-2 pointer-events-none">
        <button
          onClick={() => router.back()}
          className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/15 text-white"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-white text-sm font-black tracking-tight" style={{ fontFamily: 'system-ui' }}>
            spontra
          </span>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: themeColor }}
          >
            {theme}
          </span>
        </div>

        <Link
          href="/feed/saved"
          className="relative w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/15 text-white"
        >
          <Bookmark size={18} />
          {savedCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-black"
              style={{ backgroundColor: themeColor }}
            >
              {savedCount > 9 ? '9+' : savedCount}
            </span>
          )}
        </Link>
      </div>

      {/* ── Feed ────────────────────────────────────────────────────── */}
      <SwipeFeed
        origin={origin}
        theme={theme}
        maxFlightMinutes={maxMin}
      />
    </div>
  )
}
