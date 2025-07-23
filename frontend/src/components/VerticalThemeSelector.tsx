import { THEME_COLORS, getThemeColor, getThemeHoverColor, type ThemeKey } from '@/lib/theme'

interface Theme {
  id: string
  label: string
  icon: string
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
  const getIconPath = (themeId: string) => {
    switch (themeId) {
      case 'party': return '/party-icon.png'
      case 'nature': return '/nature-icon.png'
      case 'shopping': return '/shopping-icon.png'
      case 'learn': return '/learn-icon.png'
      case 'adventure': return null // No icon yet
      default: return null
    }
  }

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id
          const themeKey = theme.id as ThemeKey
          const primaryColor = getThemeColor(themeKey)
          const hoverColor = getThemeHoverColor(themeKey)
          const iconPath = getIconPath(theme.id)
          
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeSelect(theme.id)}
              className="flex items-center gap-3 p-2 rounded group"
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
              {/* Theme Icon or Color Box */}
              {iconPath ? (
                <div
                  className="flex-shrink-0 rounded flex items-center justify-center"
                  style={{
                    width: '30px',
                    height: isSelected ? '34px' : '24px',
                    transition: 'all 300ms ease-out'
                  }}
                >
                  <img
                    src={iconPath}
                    alt={`${theme.label} icon`}
                    className="w-full h-full object-contain"
                    style={{
                      filter: isSelected ? `brightness(0) saturate(100%) invert(1)` : 'none',
                      transition: 'all 300ms ease-out'
                    }}
                  />
                </div>
              ) : (
                <div
                  className="flex-shrink-0 rounded"
                  style={{
                    width: '30px',
                    height: isSelected ? '34px' : '24px',
                    backgroundColor: primaryColor,
                    boxShadow: isSelected ? `0 0 8px ${primaryColor}40` : 'none',
                    transition: 'all 300ms ease-out'
                  }}
                />
              )}
              
              {/* Theme Label */}
              <span
                className="font-muli text-white"
                style={{
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? primaryColor : 'rgb(255, 255, 255)',
                  transition: 'all 300ms ease-out'
                }}
              >
                {theme.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}