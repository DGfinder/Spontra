'use client'

import { useState } from 'react'
import { DestinationHero } from './destination/DestinationHero'
import { ThemeTabs } from './destination/ThemeTabs'
import { POIVideoFeed } from './destination/POIVideoFeed'

export interface POIVideo {
  id: string
  poiId: string
  videoUrl: string
  displayOrder: number
  createdAt: string
}

export interface ThemePOI {
  id: string
  destinationId: string
  theme: string
  name: string
  description: string | null
  videoUrl: string | null
  displayOrder: number
  latitude: number | null
  longitude: number | null
  createdAt: string
  updatedAt: string
  videos: POIVideo[]
}

export interface DestinationData {
  id: string
  cityName: string
  airportCode: string | null
  description: string | null
  country: {
    name: string
    code: string
  } | null
  themePOIs: ThemePOI[]
}

interface DestinationDetailProps {
  destination: DestinationData
  originAirport?: string
  selectedTheme?: string
}

const THEMES = [
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'nature', label: 'Nature', emoji: '🌲' },
  { value: 'vibe', label: 'Vibe', emoji: '🎭' },
  { value: 'indulge', label: 'Indulge', emoji: '🍷' },
  { value: 'discover', label: 'Discover', emoji: '🔍' }
]

export function DestinationDetail({
  destination,
  originAirport,
  selectedTheme = 'adventure'
}: DestinationDetailProps) {
  const [activeTheme, setActiveTheme] = useState(selectedTheme)

  // Filter POIs by active theme
  const themePOIs = destination.themePOIs.filter((poi) => poi.theme === activeTheme)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <DestinationHero
        destination={destination}
        originAirport={originAirport}
      />

      {/* Theme Tabs */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-brand-purple/95 via-brand-purple/90 to-brand-purple/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <ThemeTabs
            themes={THEMES}
            activeTheme={activeTheme}
            onThemeChange={setActiveTheme}
            poiCounts={THEMES.reduce((acc, theme) => {
              acc[theme.value] = destination.themePOIs.filter(p => p.theme === theme.value).length
              return acc
            }, {} as Record<string, number>)}
          />
        </div>
      </div>

      {/* POI Video Feed */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {themePOIs.length > 0 ? (
          <POIVideoFeed pois={themePOIs} theme={activeTheme} />
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <p className="text-xl text-white/70">
                No {THEMES.find(t => t.value === activeTheme)?.label.toLowerCase()} experiences yet
              </p>
              <p className="text-white/50 text-sm mt-2">
                Check back soon or try a different theme
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
