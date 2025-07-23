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
  return (
    <div className="mb-4">
      <label className="block text-white/90 mb-2 font-muli" style={{ fontSize: '12px' }}>
        THEME
      </label>
      
      <div className="flex flex-col gap-2">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id
          const themeKey = theme.id as ThemeKey
          const primaryColor = getThemeColor(themeKey)
          const hoverColor = getThemeHoverColor(themeKey)
          
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
              {/* Theme Color Box */}
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