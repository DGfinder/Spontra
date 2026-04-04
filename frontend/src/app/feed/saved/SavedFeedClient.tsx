'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Plane, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useFeedStore } from '@/store/feedStore'
import { getThemeColor, type ThemeKey } from '@/lib/theme'

export default function SavedFeedClient() {
  const router = useRouter()
  const { saved, unsave } = useFeedStore()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-10 flex items-center gap-4 px-5 pt-14 pb-4 bg-black/80 backdrop-blur-md border-b border-white/10">
        <button onClick={() => router.back()} className="text-white/70 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-black tracking-tight">Saved Destinations</h1>
        <span className="ml-auto text-sm text-white/40">{saved.length} saved</span>
      </div>

      {saved.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 pt-32 px-8 text-center">
          <div className="w-24 h-24 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <span className="text-5xl">🗺️</span>
          </div>
          <div>
            <h2 className="text-white text-xl font-black tracking-tight mb-2">No saved destinations yet</h2>
            <p className="text-white/40 text-sm max-w-xs leading-relaxed">
              Swipe right on destinations in the explore feed to save them here for later.
            </p>
          </div>
          <button
            onClick={() => router.push('/feed')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-black"
            style={{ backgroundColor: '#ee6d16' }}
          >
            <Plane size={14} /> Start Exploring
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {saved.map(item => {
            const themeColor = getThemeColor(item.themeSlug as ThemeKey)
            return (
              <div key={item.iata} className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                <img src={item.imageUrl} alt={item.cityName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-black text-lg leading-none">{item.cityName}</p>
                  <p className="text-white/60 text-xs mt-0.5">{item.countryName}</p>
                  {item.estimatedPrice && (
                    <p className="text-xs font-bold mt-1" style={{ color: themeColor }}>
                      from {item.currency}{Math.round(item.estimatedPrice)}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const p = new URLSearchParams({ origin: 'SYD', destination: item.iata, passengers: '1', class: 'ECONOMY' })
                        window.open(`/api/book?${p}`, '_blank')
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold text-black"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Plane size={11} /> Book
                    </button>
                    <button
                      onClick={() => {
                        unsave(item.iata)
                        toast('Destination removed', { duration: 2000 })
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
