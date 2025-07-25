import { THEME_COLORS, getThemeColor, getThemeHoverColor, type ThemeKey } from '@/lib/theme'
import { Mountain, Trees, ShoppingBag, Music, BookOpen } from 'lucide-react'

interface Theme {
  id: string
  label: string
  background: string
  color: string
}

interface VerticalThemeSelectorProps {
  themes: Theme[]
  selectedTheme: string
  onThemeSelect: (themeId: string) => void
}

export function VerticalThemeSelector({
  themes,
  selectedTheme,
  onThemeSelect
}: VerticalThemeSelectorProps) {
  const getThemeIcon = (themeId: string, isSelected: boolean, primaryColor: string) => {
    const iconProps = {
      size: 14,
      color: isSelected ? 'white' : primaryColor,
      strokeWidth: isSelected ? 2.5 : 2
    }
    
    switch (themeId) {
      case 'adventure': return <Mountain {...iconProps} />
      case 'nature': return <Trees {...iconProps} />
      case 'shopping': return <ShoppingBag {...iconProps} />
      case 'party': return <Music {...iconProps} />
      case 'learn': return <BookOpen {...iconProps} />
      default: return null
    }
  }

  return (
    <div className="mb-3">
      <fieldset>
        <legend className="sr-only">Choose your travel theme</legend>
        <div className="flex flex-col gap-1" role="radiogroup" aria-label="Travel themes">
          {themes.map((theme) => {
            const isSelected = selectedTheme === theme.id
            const themeKey = theme.id as ThemeKey
            const primaryColor = getThemeColor(themeKey)
            const hoverColor = getThemeHoverColor(themeKey)
            const themeIcon = getThemeIcon(theme.id, isSelected, primaryColor)
            
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onThemeSelect(theme.id)}
                className="flex items-center gap-2 p-1 rounded group"
                role="radio"
                aria-checked={isSelected}
                aria-describedby={`theme-${theme.id}-description`}
              style={{
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                transition: 'all 300ms ease-out'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
              aria-label={`Select ${theme.label} theme`}
            >
              {/* Theme Icon */}
              <div
                className="flex-shrink-0 rounded flex items-center justify-center"
                style={{
                  width: '26px',
                  height: isSelected ? '28px' : '26px',
                  backgroundColor: isSelected ? primaryColor : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  border: isSelected ? `2px solid ${primaryColor}` : '2px solid transparent',
                  transition: 'all 300ms ease-out'
                }}
              >
                {themeIcon}
              </div>
              
              {/* Theme Label */}
              <span
                className="font-muli text-white"
                style={{
                  fontSize: '10px',
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? primaryColor : 'rgb(255, 255, 255)',
                  transition: 'all 300ms ease-out'
                }}
                id={`theme-${theme.id}-description`}
              >
                {theme.label}
              </span>
            </button>
          )
        })}
        </div>
      </fieldset>
    </div>
  )
}