import { Mountain, Trees, ShoppingBag, Music, BookOpen } from 'lucide-react'

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

export function ThemeSelector({ themes, selectedTheme, onThemeSelect }: ThemeSelectorProps) {
  const getThemeIcon = (themeId: string, isSelected: boolean) => {
    const iconProps = {
      size: 18,
      color: isSelected ? '#000000' : '#ffffff',
      strokeWidth: 2
    }
    
    switch (themeId) {
      case 'adventure': return <Mountain {...iconProps} />
      case 'nature': return <Trees {...iconProps} />
      case 'shopping': return <ShoppingBag {...iconProps} />
      case 'party': return <Music {...iconProps} />
      case 'learn': return <BookOpen {...iconProps} />
      default: return <></>  // Return empty fragment instead of null
    }
  }
  return (
    <div className="mb-4 md:mb-6">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-1 md:gap-2">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeSelect(theme.id)}
              className={`p-2 md:p-3 rounded text-xs transition-all duration-200 ${
                isSelected
                  ? 'bg-white text-black'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              aria-label={`Select ${theme.label} theme`}
            >
              <div className="text-center">
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