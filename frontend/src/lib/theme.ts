// Theme configuration matching the original design
export const THEME_COLORS = {
  adventure: {
    primary: 'rgb(255, 189, 10)', // Gold/Yellow
    hover: 'rgb(255, 199, 40)',
    name: 'Adventure'
  },
  party: {
    primary: 'rgb(235, 91, 37)', // Orange/Red
    hover: 'rgb(245, 101, 47)',
    name: 'Party'
  },
  nature: {
    primary: 'rgb(2, 192, 109)', // Green
    hover: 'rgb(12, 202, 119)',
    name: 'Nature'
  },
  shopping: {
    primary: 'rgb(229, 43, 0)', // Red
    hover: 'rgb(239, 53, 10)',
    name: 'Shopping'
  },
  learn: {
    primary: 'rgb(127, 106, 228)', // Purple
    hover: 'rgb(137, 116, 238)',
    name: 'Learn'
  }
} as const

export const DESIGN_TOKENS = {
  colors: {
    overlay: 'rgba(0, 0, 0, 0.702)', // 70.2% black
    gray: {
      light: 'rgb(230, 230, 230)',
      medium: 'rgb(220, 220, 220)',
      dark: 'rgb(46, 45, 44)'
    },
    white: 'rgb(255, 255, 255)'
  },
  
  spacing: {
    formGap: '10px',
    panelPadding: '20px',
    fieldHeight: '32px',
    fieldWidth: '150px',
    themeBoxSize: '30px',
    themeBoxHeight: '24px',
    themeBoxHeightActive: '34px'
  },
  
  typography: {
    fontFamily: '"Muli", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    sizes: {
      heading: '18px',
      label: '12px',
      input: '11px',
      button: '18.325px'
    },
    weights: {
      normal: 400,
      bold: 700
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.637,
      relaxed: 1.944,
      loose: 2.727
    }
  },
  
  layout: {
    formPanelWidth: '370px',
    detailsPanelWidth: '369px',
    totalWidth: '739px',
    desktopWidth: '1920px',
    desktopHeight: '1080px'
  },
  
  transitions: {
    fast: '200ms ease-out',
    normal: '300ms ease-out',
    slow: '500ms ease-out'
  },
  
  shadows: {
    button: '0 2px 4px rgba(0, 0, 0, 0.1)',
    panel: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }
} as const

export type ThemeKey = keyof typeof THEME_COLORS

export const getThemeColor = (theme: ThemeKey): string => {
  return THEME_COLORS[theme]?.primary || THEME_COLORS.adventure.primary
}

export const getThemeHoverColor = (theme: ThemeKey): string => {
  return THEME_COLORS[theme]?.hover || THEME_COLORS.adventure.hover
}

export const getThemeGradient = (theme: ThemeKey): string => {
  const primary = getThemeColor(theme)
  const hover = getThemeHoverColor(theme)
  return `linear-gradient(90deg, ${primary} 0%, ${hover} 100%)`
}

const toRgba = (rgb: string, alpha: number): string => {
  try {
    return rgb.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  } catch {
    return rgb
  }
}

export const getThemeColorAlpha = (theme: ThemeKey, alpha: number): string => {
  return toRgba(getThemeColor(theme), alpha)
}

export const getThemeHoverColorAlpha = (theme: ThemeKey, alpha: number): string => {
  return toRgba(getThemeHoverColor(theme), alpha)
}

// ============================================================================
// CONSOLIDATED THEME UTILITIES
// ============================================================================

// Tailwind CSS class mappings for themes
export const THEME_TAILWIND_CLASSES = {
  adventure: {
    bg: 'bg-orange-500',
    bgHover: 'bg-orange-600',
    text: 'text-orange-500',
    textHover: 'text-orange-600',
    border: 'border-orange-500',
    ring: 'ring-orange-500'
  },
  party: {
    bg: 'bg-purple-500',
    bgHover: 'bg-purple-600',
    text: 'text-purple-500',
    textHover: 'text-purple-600',
    border: 'border-purple-500',
    ring: 'ring-purple-500'
  },
  nature: {
    bg: 'bg-green-500',
    bgHover: 'bg-green-600',
    text: 'text-green-500',
    textHover: 'text-green-600',
    border: 'border-green-500',
    ring: 'ring-green-500'
  },
  shopping: {
    bg: 'bg-pink-500',
    bgHover: 'bg-pink-600',
    text: 'text-pink-500',
    textHover: 'text-pink-600',
    border: 'border-pink-500',
    ring: 'ring-pink-500'
  },
  learn: {
    bg: 'bg-blue-500',
    bgHover: 'bg-blue-600',
    text: 'text-blue-500',
    textHover: 'text-blue-600',
    border: 'border-blue-500',
    ring: 'ring-blue-500'
  }
} as const

// Consolidated theme utility functions
export const getThemeClasses = (theme: ThemeKey) => {
  return THEME_TAILWIND_CLASSES[theme] || THEME_TAILWIND_CLASSES.adventure
}

export const getThemeBgClass = (theme: ThemeKey, hover = false): string => {
  const classes = getThemeClasses(theme)
  return hover ? `${classes.bg} ${classes.bgHover}` : classes.bg
}

export const getThemeTextClass = (theme: ThemeKey, hover = false): string => {
  const classes = getThemeClasses(theme)
  return hover ? `${classes.text} ${classes.textHover}` : classes.text
}

// Theme-to-activity mappings (consolidated from themeDestinationService.ts)
export const THEME_ACTIVITY_MAPPINGS = {
  adventure: ['hiking', 'climbing', 'skiing', 'diving', 'bungee', 'rafting', 'safari', 'trekking'],
  nature: ['hiking', 'camping', 'wildlife', 'gardens', 'parks', 'beaches', 'forests', 'mountains'],
  shopping: ['markets', 'malls', 'boutiques', 'outlets', 'fashion', 'crafts', 'souvenirs', 'local_goods'],
  party: ['nightlife', 'bars', 'clubs', 'festivals', 'concerts', 'events', 'music', 'dancing'],
  learn: ['museums', 'galleries', 'tours', 'history', 'culture', 'architecture', 'workshops', 'classes']
} as const

export const getThemeActivities = (theme: ThemeKey): readonly string[] => {
  return THEME_ACTIVITY_MAPPINGS[theme] || THEME_ACTIVITY_MAPPINGS.adventure
}

// Theme icons (consolidated from multiple components)
export interface ThemeIconProps {
  className?: string
  size?: number
  strokeWidth?: number
}

// Unified theme configuration for easy maintenance
export const THEME_CONFIG = {
  adventure: {
    id: 'adventure',
    label: 'Adventure',
    color: THEME_COLORS.adventure,
    classes: THEME_TAILWIND_CLASSES.adventure,
    activities: THEME_ACTIVITY_MAPPINGS.adventure,
    background: '/adventure-background.jpg',
    description: 'Thrilling adventures and adrenaline-packed experiences',
    keywords: ['thrilling', 'adrenaline', 'outdoor', 'extreme', 'active']
  },
  party: {
    id: 'party',
    label: 'Party',
    color: THEME_COLORS.party,
    classes: THEME_TAILWIND_CLASSES.party,
    activities: THEME_ACTIVITY_MAPPINGS.party,
    background: '/party-background.jpg',
    description: 'Vibrant nightlife and entertainment experiences',
    keywords: ['nightlife', 'entertainment', 'music', 'dancing', 'social']
  },
  nature: {
    id: 'nature',
    label: 'Nature',
    color: THEME_COLORS.nature,
    classes: THEME_TAILWIND_CLASSES.nature,
    activities: THEME_ACTIVITY_MAPPINGS.nature,
    background: '/nature-background.jpg',
    description: 'Peaceful natural settings and outdoor beauty',
    keywords: ['peaceful', 'natural', 'outdoors', 'scenic', 'relaxing']
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    color: THEME_COLORS.shopping,
    classes: THEME_TAILWIND_CLASSES.shopping,
    activities: THEME_ACTIVITY_MAPPINGS.shopping,
    background: '/shopping-background.jpg',
    description: 'Fashion districts and unique shopping experiences',
    keywords: ['fashion', 'retail', 'markets', 'boutiques', 'local']
  },
  learn: {
    id: 'learn',
    label: 'Learn',
    color: THEME_COLORS.learn,
    classes: THEME_TAILWIND_CLASSES.learn,
    activities: THEME_ACTIVITY_MAPPINGS.learn,
    background: '/learn-background.jpg',
    description: 'Cultural enrichment and educational experiences',
    keywords: ['cultural', 'educational', 'history', 'museums', 'art']
  }
} as const

export const getThemeConfig = (theme: ThemeKey) => {
  return THEME_CONFIG[theme] || THEME_CONFIG.adventure
}

// Theme validation utilities
export const isValidTheme = (theme: string): theme is ThemeKey => {
  return theme in THEME_COLORS
}

export const validateTheme = (theme: string): ThemeKey => {
  return isValidTheme(theme) ? theme : 'adventure'
}

// Theme scoring utilities (consolidated from multiple services)
export type ThemeScores = Record<ThemeKey, number>

export const calculateThemeScore = (activities: string[], theme: ThemeKey): number => {
  const themeActivities = getThemeActivities(theme)
  const matches = activities.filter(activity => 
    themeActivities.some(themeActivity => 
      activity.toLowerCase().includes(themeActivity.toLowerCase()) ||
      themeActivity.toLowerCase().includes(activity.toLowerCase())
    )
  )
  return matches.length / Math.max(activities.length, 1)
}

export const getTopThemes = (scores: ThemeScores, limit = 3): Array<{ theme: ThemeKey; score: number }> => {
  return Object.entries(scores)
    .map(([theme, score]) => ({ theme: theme as ThemeKey, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// Style utilities for consistency
export const createThemeStyles = (theme: ThemeKey) => ({
  backgroundColor: getThemeColor(theme),
  color: 'white',
  border: `2px solid ${getThemeColor(theme)}`,
  borderRadius: '8px',
  transition: 'all 0.3s ease'
})

export const createThemeGradientStyles = (theme: ThemeKey) => ({
  background: getThemeGradient(theme),
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  transition: 'all 0.3s ease'
})

// Theme icon utility (consolidated from multiple components)
export const getThemeIconName = (theme: ThemeKey): string => {
  const iconMap: Record<ThemeKey, string> = {
    adventure: 'Mountain',
    nature: 'Trees', 
    shopping: 'ShoppingBag',
    party: 'Music',
    learn: 'BookOpen'
  }
  return iconMap[theme] || iconMap.adventure
}

// Helper for creating consistent theme-based component configurations
export const createThemeComponentConfig = (theme: ThemeKey) => ({
  ...getThemeConfig(theme),
  styles: createThemeStyles(theme),
  gradientStyles: createThemeGradientStyles(theme),
  tailwindClasses: getThemeClasses(theme),
  iconName: getThemeIconName(theme)
})

// Re-export commonly used types for convenience
export type { ThemeIconProps, ThemeScores }