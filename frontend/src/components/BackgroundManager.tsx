'use client'

import { useSearchStore } from '@/lib/store'
import { useEffect, useState } from 'react'

const themeBackgrounds = {
  adventure: '/backgrounds/adventure-background',
  nature: '/backgrounds/nature-background',
  indulge: '/backgrounds/indulge-background',
  vibe: '/backgrounds/vibe-background',
  discover: '/backgrounds/discover-background',
} as const

export function BackgroundManager() {
  const { filters } = useSearchStore()
  const [currentBg, setCurrentBg] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Preload all background images
  useEffect(() => {
    const themes = Object.keys(themeBackgrounds) as Array<keyof typeof themeBackgrounds>

    // Preload WebP images
    themes.forEach((theme) => {
      const img = new Image()
      img.src = `${themeBackgrounds[theme]}.webp`
    })

    // Preload JPG fallbacks
    themes.forEach((theme) => {
      const img = new Image()
      img.src = `${themeBackgrounds[theme]}.jpg`
    })

    setIsLoaded(true)
  }, [])

  // Update background when theme changes
  useEffect(() => {
    if (filters.theme && filters.theme in themeBackgrounds) {
      const bgPath = themeBackgrounds[filters.theme as keyof typeof themeBackgrounds]
      setCurrentBg(bgPath)
    } else {
      // Default/no theme selected
      setCurrentBg('')
    }
  }, [filters.theme])

  // Check if browser supports WebP
  const supportsWebP = () => {
    const elem = document.createElement('canvas')
    if (elem.getContext && elem.getContext('2d')) {
      return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0
    }
    return false
  }

  const getBackgroundUrl = () => {
    if (!currentBg) return ''
    return supportsWebP() ? `${currentBg}.webp` : `${currentBg}.jpg`
  }

  return (
    <>
      {/* Background Image with smooth transition */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: currentBg ? `url('${getBackgroundUrl()}')` : 'none',
          opacity: isLoaded && currentBg ? 1 : 0,
        }}
      />

      {/* Dark overlay for text readability */}
      <div
        className="fixed inset-0 transition-opacity duration-700"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          opacity: currentBg ? 1 : 0,
        }}
      />

      {/* Fallback gradient (when no theme selected or loading) */}
      <div
        className="fixed inset-0 bg-linear-to-br from-brand-blue via-brand-indigo to-brand-purple transition-opacity duration-700"
        style={{
          opacity: currentBg ? 0 : 1,
        }}
      />

      {/* Background pattern overlay */}
      <div
        className="fixed inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"
        aria-hidden="true"
      />
    </>
  )
}
