import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, options) => ({ data, options }))
  }
}))

// Mock PostgreSQL client
const mockQuery = vi.fn()
const mockConnect = vi.fn()
const mockEnd = vi.fn()

vi.mock('pg', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    query: mockQuery,
    end: mockEnd
  }))
}))

// Mock environment
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

describe('Airport Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnect.mockResolvedValue(undefined)
    mockEnd.mockResolvedValue(undefined)
  })

  describe('Basic Search', () => {
    it('should search airports by IATA code', async () => {
      const mockRows = [
        {
          iata_code: 'LHR',
          icao_code: 'EGLL',
          name: 'London Heathrow Airport',
          city: 'London',
          country: 'United Kingdom',
          latitude: 51.4700,
          longitude: -0.4543,
          timezone: 'Europe/London'
        }
      ]
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      // Mock the API route
      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=LHR&limit=20'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      expect(response.data.results).toHaveLength(1)
      expect(response.data.results[0].code).toBe('LHR')
      expect(response.data.results[0].name).toBe('London Heathrow Airport')
      expect(response.data.results[0].importance_score).toBe(100) // LHR is a major hub
    })

    it('should search airports by city name', async () => {
      const mockRows = [
        {
          iata_code: 'LHR',
          icao_code: 'EGLL', 
          name: 'London Heathrow Airport',
          city: 'London',
          country: 'United Kingdom',
          latitude: 51.4700,
          longitude: -0.4543,
          timezone: 'Europe/London'
        },
        {
          iata_code: 'LGW',
          icao_code: 'EGKK',
          name: 'London Gatwick Airport', 
          city: 'London',
          country: 'United Kingdom',
          latitude: 51.1481,
          longitude: -0.1903,
          timezone: 'Europe/London'
        }
      ]
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=London&limit=20'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      expect(response.data.results).toHaveLength(2)
      expect(response.data.results.every((r: any) => r.city === 'London')).toBe(true)
      // LHR should rank higher than LGW due to importance score
      expect(response.data.results[0].code).toBe('LHR')
    })

    it('should return empty results for short queries', async () => {
      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=L' // Too short
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      expect(response.data.results).toHaveLength(0)
      expect(mockQuery).not.toHaveBeenCalled()
    })
  })

  describe('City Code Support', () => {
    it('should handle NYC city code', async () => {
      const mockRows = [
        {
          iata_code: 'JFK',
          icao_code: 'KJFK',
          name: 'John F. Kennedy International Airport',
          city: 'New York',
          country: 'United States',
          latitude: 40.6413,
          longitude: -73.7781,
          timezone: 'America/New_York'
        },
        {
          iata_code: 'LGA',
          icao_code: 'KLGA',
          name: 'LaGuardia Airport',
          city: 'New York', 
          country: 'United States',
          latitude: 40.7769,
          longitude: -73.8740,
          timezone: 'America/New_York'
        },
        {
          iata_code: 'EWR',
          icao_code: 'KEWR',
          name: 'Newark Liberty International Airport',
          city: 'New York',
          country: 'United States',
          latitude: 40.6895,
          longitude: -74.1745,
          timezone: 'America/New_York'
        }
      ]
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=NYC&limit=20&groupCities=true'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      expect(response.data.searchType).toBe('city_code')
      expect(response.data.results).toHaveLength(3)
      expect(response.data.cityGroups).toHaveLength(1)
      expect(response.data.cityGroups[0].city).toBe('New York')
      expect(response.data.cityGroups[0].airports).toHaveLength(3)
    })
  })

  describe('Search Scoring', () => {
    it('should rank exact code matches highest', async () => {
      const mockRows = [
        {
          iata_code: 'BCN',
          name: 'Barcelona-El Prat Airport',
          city: 'Barcelona',
          country: 'Spain'
        },
        {
          iata_code: 'BRU',
          name: 'Brussels Airport',
          city: 'Brussels', 
          country: 'Belgium'
        }
      ]
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=BCN&limit=20'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      expect(response.data.results[0].code).toBe('BCN')
      expect(response.data.results[0].search_score).toBeGreaterThan(
        response.data.results[1]?.search_score || 0
      )
    })

    it('should apply airport importance weighting', async () => {
      const mockRows = [
        {
          iata_code: 'LHR', // Major hub
          name: 'London Heathrow Airport',
          city: 'London',
          country: 'United Kingdom'
        },
        {
          iata_code: 'LTN', // Smaller airport
          name: 'London Luton Airport',
          city: 'London',
          country: 'United Kingdom' 
        }
      ]
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=London&limit=20'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      // LHR should rank higher due to importance score (100 vs 75)
      expect(response.data.results[0].code).toBe('LHR')
      expect(response.data.results[0].importance_score).toBe(100)
      expect(response.data.results[1].importance_score).toBe(75)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Connection failed'))

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=LHR&limit=20'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(500)
      expect(response.data.error).toContain('Search failed')
    })

    it('should handle missing database URL', async () => {
      delete process.env.DATABASE_URL
      delete process.env.SEARCH_DATABASE_URL

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=LHR&limit=20'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(503)
      expect(response.data.error).toBe('Database not configured')

      // Restore for other tests
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    })

    it('should handle SQL query errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('SQL syntax error'))

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=LHR&limit=20'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(500)
      expect(mockEnd).toHaveBeenCalled() // Should clean up connection
    })
  })

  describe('Performance Features', () => {
    it('should respect query limits', async () => {
      // Mock 100 airports
      const mockRows = Array.from({ length: 100 }, (_, i) => ({
        iata_code: `A${i.toString().padStart(2, '0')}`,
        name: `Airport ${i}`,
        city: 'Test City',
        country: 'Test Country'
      }))
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=test&limit=10'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      expect(response.data.results).toHaveLength(10)
    })

    it('should support city grouping parameter', async () => {
      const mockRows = [
        { iata_code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
        { iata_code: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK' }
      ]
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      const { GET } = await import('@/app/api/airports/search/route')
      const mockRequest = {
        url: 'http://localhost:3000/api/airports/search?q=London&groupCities=true'
      }

      const response = await GET(mockRequest as any)

      expect(response.data.ok).toBe(true)
      expect(response.data.cityGroups).toBeDefined()
      expect(Array.isArray(response.data.cityGroups)).toBe(true)
    })
  })
})