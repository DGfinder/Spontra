import { Mountain, Trees, Sparkles, Music, BookOpen } from 'lucide-react'

interface Theme {
  id: string
  label: string
  background: string
  color: string
}

interface ThemeSelectorProps {
  themes: Theme[]
  selectedTheme: string
  onThemeSelect: (themeId: string) => void
}

// Theme colour map so selected chips use the brand accent
const THEME_COLORS: Record<string, string> = {
  adventure: '#ee6d16',
  nature: '#22c55e',
  indulge: '#ec4899',
  vibe: '#eab308',
  discover: '#38bdf8',
}

export function ThemeSelector({ themes, selectedTheme, onThemeSelect }: ThemeSelectorProps) {
  const getThemeIcon = (themeId: string, isSelected: boolean) => {
    const color = isSelected ? '#ffffff' : '#ffffff'
    const iconProps = { size: 18, color, strokeWidth: 2 }
    
    switch (themeId) {
      case 'adventure': return <Mountain {...iconProps} />
      case 'nature': return <Trees {...iconProps} />
      case 'indulge': return <Sparkles {...iconProps} />
      case 'vibe': return <Music {...iconProps} />
      case 'discover': return <BookOpen {...iconProps} />
      default: return <></>
    }
  }

  return (
    <div className="mb-4 md:mb-6">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-1 md:gap-2">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id
          const accentColor = THEME_COLORS[theme.id] ?? '#ee6d16'
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeSelect(theme.id)}
              className={`relative p-2 md:p-3 rounded-lg text-xs transition-all duration-200 ease-out active:scale-95 ${
                isSelected
                  ? 'scale-105 shadow-lg text-white'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              }`}
              style={isSelected ? {
                backgroundColor: `${accentColor}22`,
                border: `1px solid ${accentColor}66`,
                boxShadow: `0 0 12px ${accentColor}33`,
              } : {
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              aria-label={`Select ${theme.label} theme`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <span
                  className="absolute inset-0 rounded-lg animate-pulse pointer-events-none"
                  style={{ boxShadow: `inset 0 0 8px ${accentColor}22` }}
                />
              )}
              <div className="text-center relative z-10">
                <div className="text-sm md:text-lg mb-1 flex justify-center">
                  {getThemeIcon(theme.id, isSelected)}
                </div>
                <div className="text-xs font-medium hidden md:block">{theme.label}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}