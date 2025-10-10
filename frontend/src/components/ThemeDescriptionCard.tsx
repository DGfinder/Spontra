'use client'

import { getThemeConfig } from '@/lib/constants/themes'

interface ThemeDescriptionCardProps {
  theme: string
}

export function ThemeDescriptionCard({ theme }: ThemeDescriptionCardProps) {
  if (!theme) return null

  const themeConfig = getThemeConfig(theme)

  return (
    <div className="absolute top-[45%] right-6 transform -translate-y-1/2 z-10 hidden lg:block animate-in slide-in-from-right-8 fade-in duration-500">
      <div
        className="relative bg-black/70 backdrop-blur-md rounded-xl p-6 max-w-sm border border-white/10 transition-all duration-500 hover:scale-[1.02] group"
        style={{
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px ${themeConfig.color}20`
        }}
      >
        {/* Top accent border */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, ${themeConfig.color}00, ${themeConfig.color}, ${themeConfig.color}00)`
          }}
        />

        <div className="flex items-start gap-4">
          {/* Theme indicator */}
          <div
            className="w-1 h-full min-h-[80px] rounded-full flex-shrink-0 transition-all duration-500 shadow-lg"
            style={{
              background: `linear-gradient(180deg, ${themeConfig.color}, ${themeConfig.color}cc)`,
              boxShadow: `0 0 12px ${themeConfig.color}60`
            }}
          />

          <div className="flex-1">
            <h3 className="text-white font-semibold text-base mb-3 tracking-tight leading-snug transition-all duration-500">
              {themeConfig.title}
            </h3>
            <p className="text-white/75 text-sm leading-[1.6] tracking-wide transition-all duration-500">
              {themeConfig.description}
            </p>
          </div>
        </div>

        {/* Subtle gradient overlay for depth */}
        <div
          className="absolute inset-0 rounded-xl opacity-5 pointer-events-none transition-opacity duration-500 group-hover:opacity-10"
          style={{
            background: `radial-gradient(circle at top left, ${themeConfig.color}, transparent)`
          }}
        />
      </div>
    </div>
  )
}
