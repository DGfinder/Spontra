// Design tokens for consistent form styling
export const FORM_DESIGN_TOKENS = {
  // Field dimensions
  fieldHeight: 'h-8',           // 32px
  fieldPadding: 'px-3 py-2',    // Consistent padding
  fieldBorderRadius: 'rounded-md',
  
  // Typography
  labelFontSize: 'text-xs',     // 12px
  fieldFontSize: 'text-sm',     // 14px
  buttonFontSize: 'text-lg',    // 18px
  
  // Spacing
  fieldGap: 'gap-2',           // 8px between fields
  sectionGap: 'gap-3',         // 12px between sections
  
  // Colors
  errorColor: 'text-red-400',
  errorBgColor: 'bg-red-50',
  errorBorderColor: 'ring-red-500',
  successColor: 'text-green-400',
  warningColor: 'text-yellow-300',
  
  // Focus states
  focusRing: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  focusRingError: 'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  
  // Transitions
  transition: 'transition-all duration-200 ease-out',
  
  // Button dimensions
  buttonHeight: 'h-12',        // 48px
  buttonPadding: 'px-6 py-3',
  
  // Preset button dimensions
  presetButtonHeight: 'h-8',   // 32px
  presetButtonPadding: 'px-3 py-1.5',
} as const

// Theme-aware focus colors
export const getThemeFocusRing = (theme: string) => {
  const themeColors = {
    adventure: 'focus:ring-yellow-500',
    vibe: 'focus:ring-orange-500', 
    nature: 'focus:ring-green-500',
    indulge: 'focus:ring-pink-500',
    discover: 'focus:ring-purple-500',
  }
  return themeColors[theme as keyof typeof themeColors] || 'focus:ring-blue-500'
}
