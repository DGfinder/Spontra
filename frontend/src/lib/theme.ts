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