import { describe, it, expect } from 'vitest'
import {
  airportCodeSchema,
  futureDateSchema,
  searchFormSchema,
  airportSearchSchema,
  destinationSearchApiSchema,
  flightSearchApiSchema,
  sanitizeString,
  validateApiRequest,
  getValidationErrors,
} from '../validations'

// ─── Airport code ─────────────────────────────────────────────────────────────

describe('airportCodeSchema', () => {
  it('accepts valid 3-letter uppercase IATA codes', () => {
    expect(() => airportCodeSchema.parse('SYD')).not.toThrow()
    expect(() => airportCodeSchema.parse('LHR')).not.toThrow()
    expect(() => airportCodeSchema.parse('JFK')).not.toThrow()
  })

  it('rejects lowercase codes', () => {
    expect(() => airportCodeSchema.parse('syd')).toThrow()
  })

  it('rejects codes that are not exactly 3 letters', () => {
    expect(() => airportCodeSchema.parse('SY')).toThrow()
    expect(() => airportCodeSchema.parse('SYDN')).toThrow()
    expect(() => airportCodeSchema.parse('')).toThrow()
  })

  it('rejects codes with numbers', () => {
    expect(() => airportCodeSchema.parse('S1D')).toThrow()
  })
})

// ─── Future date ──────────────────────────────────────────────────────────────

describe('futureDateSchema', () => {
  it('accepts today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(() => futureDateSchema.parse(today)).not.toThrow()
  })

  it('accepts a future date', () => {
    const future = new Date(Date.now() + 7 * 86400 * 1000).toISOString().split('T')[0]
    expect(() => futureDateSchema.parse(future)).not.toThrow()
  })

  it('rejects a past date', () => {
    expect(() => futureDateSchema.parse('2020-01-01')).toThrow()
  })

  it('rejects an empty string', () => {
    expect(() => futureDateSchema.parse('')).toThrow()
  })
})

// ─── Airport search ───────────────────────────────────────────────────────────

describe('airportSearchSchema', () => {
  it('accepts a valid query', () => {
    expect(() => airportSearchSchema.parse({ query: 'Sydney' })).not.toThrow()
  })

  it('rejects an empty query', () => {
    expect(() => airportSearchSchema.parse({ query: '' })).toThrow()
  })

  it('rejects a query over 50 chars', () => {
    expect(() => airportSearchSchema.parse({ query: 'A'.repeat(51) })).toThrow()
  })
})

// ─── Destination search API ───────────────────────────────────────────────────

describe('destinationSearchApiSchema', () => {
  const validBase = {
    origin: 'SYD',
    theme: 'adventure',
    minFlightTime: 1,
    maxFlightTime: 8,
  }

  it('accepts a valid request', () => {
    expect(() => destinationSearchApiSchema.parse(validBase)).not.toThrow()
  })

  it('rejects when minFlightTime > maxFlightTime', () => {
    expect(() =>
      destinationSearchApiSchema.parse({ ...validBase, minFlightTime: 10, maxFlightTime: 5 })
    ).toThrow()
  })

  it('rejects when theme is missing', () => {
    const { theme: _t, ...rest } = validBase
    expect(() => destinationSearchApiSchema.parse(rest)).toThrow()
  })
})

// ─── Flight search API ────────────────────────────────────────────────────────

describe('flightSearchApiSchema', () => {
  const tomorrow = new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0]

  const validFlight = {
    origin: 'SYD',
    destination: 'LHR',
    departureDate: tomorrow,
    passengers: 1,
  }

  it('accepts a valid one-way flight', () => {
    expect(() => flightSearchApiSchema.parse(validFlight)).not.toThrow()
  })

  it('accepts an optional cabin class', () => {
    expect(() =>
      flightSearchApiSchema.parse({ ...validFlight, travelClass: 'BUSINESS' })
    ).not.toThrow()
  })

  it('rejects an invalid cabin class', () => {
    expect(() =>
      flightSearchApiSchema.parse({ ...validFlight, travelClass: 'FIRST_CLASS' })
    ).toThrow()
  })

  it('rejects more than 8 passengers', () => {
    expect(() =>
      flightSearchApiSchema.parse({ ...validFlight, passengers: 9 })
    ).toThrow()
  })
})

// ─── sanitizeString ───────────────────────────────────────────────────────────

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })

  it('strips XSS characters', () => {
    expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
  })

  it('removes null bytes', () => {
    expect(sanitizeString('abc\0def')).toBe('abcdef')
  })

  it('truncates to 1000 chars', () => {
    expect(sanitizeString('A'.repeat(1500))).toHaveLength(1000)
  })

  it('returns empty string for non-string input', () => {
    expect(sanitizeString(123 as unknown as string)).toBe('')
  })
})

// ─── validateApiRequest ───────────────────────────────────────────────────────

describe('validateApiRequest', () => {
  it('returns success for valid data', () => {
    const result = validateApiRequest(airportSearchSchema, { query: 'Sydney' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.query).toBe('Sydney')
  })

  it('returns errors for invalid data', () => {
    const result = validateApiRequest(airportSearchSchema, { query: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors).toHaveProperty('query')
  })

  it('sanitizes string fields when requested', () => {
    const result = validateApiRequest(airportSearchSchema, { query: '  Paris  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.query).toBe('Paris')
  })
})

// ─── getValidationErrors ──────────────────────────────────────────────────────

describe('getValidationErrors', () => {
  it('returns empty object for valid data', () => {
    expect(getValidationErrors(airportSearchSchema, { query: 'Berlin' })).toEqual({})
  })

  it('returns error messages keyed by field path', () => {
    const errors = getValidationErrors(airportSearchSchema, { query: '' })
    expect(errors).toHaveProperty('query')
    expect(typeof errors.query).toBe('string')
  })
})

// ─── searchFormSchema cross-field refinements ─────────────────────────────────

describe('searchFormSchema cross-field refinements', () => {
  const tomorrow = new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0]
  const dayAfter = new Date(Date.now() + 2 * 86400 * 1000).toISOString().split('T')[0]

  const validSearch = {
    selectedTheme: 'adventure',
    departureAirport: 'SYD',
    departureDate: tomorrow,
    passengers: 1,
    tripType: 'one-way' as const,
  }

  it('accepts a valid one-way search', () => {
    expect(() => searchFormSchema.parse(validSearch)).not.toThrow()
  })

  it('accepts a valid return trip with future return date', () => {
    expect(() =>
      searchFormSchema.parse({
        ...validSearch,
        tripType: 'return',
        returnDate: dayAfter,
      })
    ).not.toThrow()
  })

  it('rejects return trip without returnDate', () => {
    expect(() =>
      searchFormSchema.parse({ ...validSearch, tripType: 'return' })
    ).toThrow()
  })

  it('rejects when origin and destination are the same', () => {
    expect(() =>
      searchFormSchema.parse({ ...validSearch, destinationAirport: 'SYD' })
    ).toThrow()
  })

  it('rejects 0 passengers', () => {
    expect(() => searchFormSchema.parse({ ...validSearch, passengers: 0 })).toThrow()
  })

  it('rejects more than 8 passengers', () => {
    expect(() => searchFormSchema.parse({ ...validSearch, passengers: 9 })).toThrow()
  })
})
