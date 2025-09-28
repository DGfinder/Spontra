import { describe, expect, it } from 'vitest'

import { applyReelDelta, evaluateReelGating, isThemeReady } from '../themeReadiness'

describe('theme readiness helpers', () => {
  it('returns ready only when enabled and reel count inside window', () => {
    expect(isThemeReady({ isEnabled: false, reelCount: 7, min: 5, max: 10 })).toBe(false)
    expect(isThemeReady({ isEnabled: true, reelCount: 4, min: 5, max: 10 })).toBe(false)
    expect(isThemeReady({ isEnabled: true, reelCount: 11, min: 5, max: 10 })).toBe(false)
    expect(isThemeReady({ isEnabled: true, reelCount: 7, min: 5, max: 10 })).toBe(true)
  })

  it('evaluates gating boundaries correctly', () => {
    expect(evaluateReelGating(3, 5, 10)).toBe('below')
    expect(evaluateReelGating(8, 5, 10)).toBe('ok')
    expect(evaluateReelGating(15, 5, 10)).toBe('above')
  })

  it('applies reel delta without going negative', () => {
    expect(applyReelDelta(5, 3)).toBe(8)
    expect(applyReelDelta(2, -1)).toBe(1)
    expect(applyReelDelta(2, -5)).toBe(0)
  })
})
