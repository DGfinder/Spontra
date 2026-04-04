import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, debounce, formatCurrency, formatDuration, formatAirport } from '../utils'

// ─── cn (Tailwind class merge) ────────────────────────────────────────────────

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles conditional class objects', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('ignores falsy values', () => {
    expect(cn('base', false, null, undefined, 'extra')).toBe('base extra')
  })
})

// ─── debounce ────────────────────────────────────────────────────────────────

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not call the function immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)
    debounced('arg')
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls the function after the wait period', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)
    debounced('hello')
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('hello')
  })

  it('only fires once when called multiple times within the wait window', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced('b')
    debounced('c')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('c')
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats euros by default', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1,234.56')
  })

  it('formats AUD correctly', () => {
    const result = formatCurrency(500, 'AUD')
    expect(result).toContain('500')
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

// ─── formatDuration ───────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0m')
  })
})

// ─── formatAirport ────────────────────────────────────────────────────────────

describe('formatAirport', () => {
  it('returns the IATA code when no detailed name given', () => {
    expect(formatAirport('SYD')).toBe('SYD')
  })

  it('returns the detailed name when provided', () => {
    expect(formatAirport('SYD', 'Sydney Kingsford Smith (SYD)')).toBe(
      'Sydney Kingsford Smith (SYD)'
    )
  })

  it('returns empty string for undefined code', () => {
    expect(formatAirport(undefined)).toBe('')
  })
})
