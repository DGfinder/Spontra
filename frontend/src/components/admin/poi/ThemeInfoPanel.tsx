'use client'

import { getThemeConfig } from '@/lib/constants/themes'
import type { ThemePOI } from '@/lib/hooks/usePOIManagement'

interface ThemeInfoPanelProps {
  theme: string
  uiMode: 'list' | 'select-template' | 'add-poi' | 'edit-poi' | 'add-videos' | 'edit-video'
  selectedPOI?: ThemePOI | null
  selectedCount?: number
  cityName?: string
}

export function ThemeInfoPanel({
  theme,
  uiMode,
  selectedPOI,
  selectedCount = 0,
  cityName = 'this destination'
}: ThemeInfoPanelProps) {
  const themeConfig = getThemeConfig(theme)
  const Icon = themeConfig.icon

  // Dynamic context message based on UI mode
  function getContextMessage(): string {
    if (selectedCount > 0) {
      return `${selectedCount} POI${selectedCount > 1 ? 's' : ''} selected for batch actions`
    }

    switch (uiMode) {
      case 'list':
        return 'Browse and manage your points of interest'
      case 'select-template':
        return 'Choose a template to get started quickly'
      case 'add-poi':
        return `Creating new ${themeConfig.label.toLowerCase()} experience`
      case 'edit-poi':
        return selectedPOI ? `Editing: ${selectedPOI.name}` : 'Editing POI'
      case 'add-videos':
        return selectedPOI ? `Adding videos to ${selectedPOI.name}` : 'Adding videos'
      case 'edit-video':
        return 'Editing video details'
      default:
        return 'Manage your content'
    }
  }

  return (
    <div className="relative h-full min-h-[400px] rounded-xl overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${themeConfig.background})`,
        }}
      >
        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${themeConfig.gradient} backdrop-blur-[2px]`}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-8">
        {/* Top Section - Theme Info */}
        <div className="space-y-6">
          {/* Theme Icon */}
          <div
            className="inline-flex p-4 rounded-2xl backdrop-blur-md border-2 transition-all duration-300"
            style={{
              backgroundColor: `${themeConfig.color}20`,
              borderColor: themeConfig.color
            }}
          >
            <Icon
              className="w-12 h-12 transition-all duration-300"
              style={{ color: themeConfig.color }}
            />
          </div>

          {/* Theme Title */}
          <div>
            <h3
              className="text-3xl font-bold mb-3 transition-all duration-300"
              style={{ color: themeConfig.color }}
            >
              {themeConfig.title}
            </h3>
            <p className="text-white/90 text-lg leading-relaxed">
              {themeConfig.description}
            </p>
          </div>
        </div>

        {/* Bottom Section - Context Message */}
        <div className="mt-8">
          <div
            className="px-4 py-3 rounded-lg backdrop-blur-md border transition-all duration-300"
            style={{
              backgroundColor: `${themeConfig.color}15`,
              borderColor: `${themeConfig.color}50`
            }}
          >
            <p className="text-white/80 text-sm font-medium">
              {getContextMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Accent Border */}
      <div
        className="absolute inset-0 rounded-xl border-2 pointer-events-none transition-all duration-300"
        style={{ borderColor: `${themeConfig.color}40` }}
      />
    </div>
  )
}
