export interface ThemeReadinessInput {
  isEnabled: boolean
  reelCount: number
  min: number
  max: number
}

export function evaluateReelGating(reelCount: number, min: number, max: number): 'ok' | 'below' | 'above' {
  if (reelCount < min) return 'below'
  if (reelCount > max) return 'above'
  return 'ok'
}

export function isThemeReady(input: ThemeReadinessInput): boolean {
  if (!input.isEnabled) return false
  return evaluateReelGating(input.reelCount, input.min, input.max) === 'ok'
}

export function applyReelDelta(current: number, change: number): number {
  const next = current + change
  return next < 0 ? 0 : next
}
