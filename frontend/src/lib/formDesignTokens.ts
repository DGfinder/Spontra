// Design tokens for consistent form styling
export const FORM_DESIGN_TOKENS = {
  // Field dimensions
  fieldHeight: 'h-12', // 48px inputs
  fieldPadding: 'px-4 py-3',
  fieldBorderRadius: 'rounded-2xl',

  // Typography
  labelFontSize: 'text-[11px]',
  fieldFontSize: 'text-[15px]',
  buttonFontSize: 'text-[16px]',

  // Spacing
  fieldGap: 'space-y-2',
  sectionGap: 'space-y-5',

  // Colors
  errorColor: 'text-red-300',
  errorBgColor: 'bg-red-900/20',
  errorBorderColor: 'border-red-400',
  successColor: 'text-emerald-300',
  warningColor: 'text-yellow-300',

  // Focus states
  focusRing: 'focus:ring-2 focus:ring-[var(--ring-color)] focus:ring-offset-0 focus:ring-offset-transparent',
  focusRingError: 'focus:ring-2 focus:ring-red-400 focus:ring-offset-0',

  // Transitions
  transition: 'transition-all duration-200 ease-out',

  // Button dimensions
  buttonHeight: 'h-12',
  buttonPadding: 'px-6 py-3',

  // Preset button dimensions
  presetButtonHeight: 'h-10',
  presetButtonPadding: 'px-4 py-2',
} as const

// Theme-aware focus colors
export const getThemeFocusRing = (theme: string) => {
  const themeColors: Record<string, string> = {
    adventure: '#f97316',
    nature: '#10b981',
    indulge: '#ef4444',
    vibe: '#f97316',
    discover: '#9333ea',
  }
  const fallback = '#60a5fa'
  return {
    className: FORM_DESIGN_TOKENS.focusRing,
    ringColor: themeColors[theme] ?? fallback,
  }
}
