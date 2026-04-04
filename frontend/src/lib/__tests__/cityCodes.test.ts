import { describe, it, expect } from 'vitest'
import { toCityCode, expandCity, CITY_GROUPS } from '../cityCodes'

describe('toCityCode', () => {
  it('returns the city code unchanged when input is already a city code', () => {
    expect(toCityCode('LON')).toBe('LON')
    expect(toCityCode('NYC')).toBe('NYC')
  })

  it('maps an airport to its city code', () => {
    expect(toCityCode('LHR')).toBe('LON')
    expect(toCityCode('JFK')).toBe('NYC')
    expect(toCityCode('NRT')).toBe('TYO')
  })

  it('is case-insensitive', () => {
    expect(toCityCode('lhr')).toBe('LON')
    expect(toCityCode('jfk')).toBe('NYC')
  })

  it('returns the input unchanged when no mapping exists', () => {
    expect(toCityCode('ZZZ')).toBe('ZZZ')
  })
})

describe('expandCity', () => {
  it('expands a city code to all its airports', () => {
    const airports = expandCity('LON')
    expect(airports).toContain('LHR')
    expect(airports).toContain('LGW')
    expect(airports.length).toBeGreaterThan(1)
  })

  it('returns a single-element array for a plain airport code', () => {
    expect(expandCity('SYD')).toEqual(['SYD'])
  })

  it('returns all NYC airports', () => {
    const airports = expandCity('NYC')
    expect(airports).toContain('JFK')
    expect(airports).toContain('LGA')
    expect(airports).toContain('EWR')
  })
})

describe('CITY_GROUPS', () => {
  it('contains at least one entry', () => {
    expect(CITY_GROUPS.length).toBeGreaterThan(0)
  })

  it('each group has a city and at least one airport', () => {
    for (const group of CITY_GROUPS) {
      expect(typeof group.city).toBe('string')
      expect(group.airports.length).toBeGreaterThan(0)
    }
  })

  it('airport codes are exactly 3 uppercase letters', () => {
    for (const group of CITY_GROUPS) {
      for (const airport of group.airports) {
        expect(airport).toMatch(/^[A-Z]{3}$/)
      }
    }
  })
})
