'use client'

interface Theme {
  value: string
  label: string
  emoji: string
}

interface ThemeTabsProps {
  themes: Theme[]
  activeTheme: string
  onThemeChange: (theme: string) => void
  poiCounts: Record<string, number>
}

export function ThemeTabs({ themes, activeTheme, onThemeChange, poiCounts }: ThemeTabsProps) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide">
      {themes.map((theme) => {
        const isActive = activeTheme === theme.value
        const count = poiCounts[theme.value] || 0

        return (
          <button
            key={theme.value}
            onClick={() => onThemeChange(theme.value)}
            className={`
              flex-shrink-0 px-6 py-4 text-sm font-medium transition-all duration-200
              border-b-2 whitespace-nowrap
              ${
                isActive
                  ? 'text-white border-white bg-white/10'
                  : 'text-white/60 border-transparent hover:text-white/80 hover:bg-white/5'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{theme.emoji}</span>
              <span>{theme.label}</span>
              {count > 0 && (
                <span className={`
                  ml-1 px-2 py-0.5 rounded-full text-xs
                  ${isActive ? 'bg-white/20' : 'bg-white/10'}
                `}>
                  {count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
