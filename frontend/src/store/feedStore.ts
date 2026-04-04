import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FeedDestination {
  id: string
  iata: string
  cityName: string
  countryName: string
  countryCode: string
  themeSlug: string
  imageUrl: string
  videoUrl?: string
  caption: string | null
  flightDurationMinutes: number | null
  estimatedPrice: number | null
  currency: string
}

interface FeedState {
  // Current feed
  items: FeedDestination[]
  cursor: number          // which item is "active"
  isLoading: boolean
  isFetchingMore: boolean
  origin: string
  theme: string

  // Saved (swiped right)
  saved: FeedDestination[]

  // Skipped (swiped left) — don't show again this session
  skipped: Set<string>

  // Actions
  setFeed: (items: FeedDestination[], origin: string, theme: string) => void
  appendFeed: (items: FeedDestination[]) => void
  advance: () => void
  saveItem: (item: FeedDestination) => void
  skipItem: (iata: string) => void
  unsave: (iata: string) => void
  setLoading: (v: boolean) => void
  setFetchingMore: (v: boolean) => void
  reset: () => void
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      items: [],
      cursor: 0,
      isLoading: false,
      isFetchingMore: false,
      origin: '',
      theme: 'adventure',
      saved: [],
      skipped: new Set(),

      setFeed: (items, origin, theme) => set({ items, origin, theme, cursor: 0 }),
      appendFeed: (more) => set(s => ({ items: [...s.items, ...more] })),
      advance: () => set(s => ({ cursor: Math.min(s.cursor + 1, s.items.length - 1) })),
      saveItem: (item) => set(s => ({
        saved: s.saved.some(x => x.iata === item.iata)
          ? s.saved
          : [item, ...s.saved]
      })),
      skipItem: (iata) => set(s => {
        const next = new Set(s.skipped)
        next.add(iata)
        return { skipped: next }
      }),
      unsave: (iata) => set(s => ({ saved: s.saved.filter(x => x.iata !== iata) })),
      setLoading: (v) => set({ isLoading: v }),
      setFetchingMore: (v) => set({ isFetchingMore: v }),
      reset: () => set({ items: [], cursor: 0, skipped: new Set() }),
    }),
    {
      name: 'spontra-feed',
      // Don't persist skipped (session only) or loading states
      partialize: (s) => ({ saved: s.saved }),
    }
  )
)
