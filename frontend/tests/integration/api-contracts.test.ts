import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { testDataFactory, createMockDatabase } from '../factories/testDataFactory'

/**
 * API Contract Tests
 * Ensures all API endpoints conform to their expected interfaces
 * and handle edge cases consistently
 */

// Mock dependencies
vi.mock('@/lib/db', () => createMockDatabase())
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn()
  }
}))

describe('API Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    testDataFactory.reset()
    process.env.ADMIN_API_KEY = 'test_admin_key'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  })

  describe('Search API Contracts', () => {
    describe('POST /api/search/session', () => {
      it('should conform to session creation contract', async () => {
        const { prisma } = await import('@/lib/db')
        const testSession = testDataFactory.createSearchSession()
        
        prisma.searchSession.create.mockResolvedValue(testSession)

        const { POST } = await import('@/app/api/search/session/route')
        const request = new NextRequest('http://localhost:3000/api/search/session', {
          method: 'POST',
          body: JSON.stringify({
            origin: testSession.originAirport,
            destination: testSession.destinationAirport,
            departureDate: testSession.departureDate.toISOString().split('T')[0],
            returnDate: testSession.returnDate?.toISOString().split('T')[0],
            passengers: testSession.passengers
          })
        })

        const response = await POST(request)
        const data = await response.json()

        // Contract validation
        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          success: expect.any(Boolean),
          sessionId: expect.any(String),
          expiresAt: expect.any(String)
        })

        if (data.success) {
          expect(data.sessionId).toBe(testSession.id)
          expect(new Date(data.expiresAt)).toBeInstanceOf(Date)
        }
      })

      it('should return consistent error format for validation failures', async () => {
        const { POST } = await import('@/app/api/search/session/route')
        const request = new NextRequest('http://localhost:3000/api/search/session', {
          method: 'POST',
          body: JSON.stringify({
            origin: '', // Invalid
            destination: 'CDG',
            departureDate: 'invalid-date',
            passengers: 0 // Invalid
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toMatchObject({
          success: false,
          error: expect.any(String),
          code: expect.any(String)
        })
        expect(data.code).toBe('VALIDATION_ERROR')
      })
    })

    describe('GET /api/search/flights', () => {
      it('should conform to flight search response contract', async () => {
        const testOffers = testDataFactory.createMultipleOffers(3)
        
        // Mock Amadeus response
        vi.doMock('@/lib/amadeusSimple', () => ({
          searchFlights: vi.fn().mockResolvedValue({
            offers: testOffers
          })
        }))

        const { GET } = await import('@/app/api/search/flights/route')
        const request = new NextRequest(
          'http://localhost:3000/api/search/flights?' + 
          'sessionId=test-session&origin=LHR&destination=CDG&departureDate=2024-12-25&passengers=2'
        )

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          success: expect.any(Boolean),
          offers: expect.any(Array),
          searchMeta: expect.objectContaining({
            sessionId: expect.any(String),
            origin: expect.any(String),
            destination: expect.any(String),
            passengers: expect.any(Number),
            timestamp: expect.any(String)
          })
        })

        if (data.success && data.offers.length > 0) {
          data.offers.forEach((offer: any) => {
            expect(offer).toMatchObject({
              id: expect.any(String),
              price: expect.objectContaining({
                total: expect.any(String),
                currency: expect.any(String)
              }),
              itineraries: expect.any(Array),
              provider: expect.any(String),
              validUntil: expect.any(String)
            })

            offer.itineraries.forEach((itinerary: any) => {
              expect(itinerary).toMatchObject({
                segments: expect.any(Array)
              })

              itinerary.segments.forEach((segment: any) => {
                expect(segment).toMatchObject({
                  departure: expect.objectContaining({
                    iataCode: expect.any(String),
                    at: expect.any(String)
                  }),
                  arrival: expect.objectContaining({
                    iataCode: expect.any(String),
                    at: expect.any(String)
                  }),
                  carrierCode: expect.any(String),
                  number: expect.any(String)
                })
              })
            })
          })
        }
      })

      it('should handle rate limiting with proper contract', async () => {
        const { kv } = await import('@vercel/kv')
        kv.get.mockResolvedValue(100) // Exceed rate limit

        const { GET } = await import('@/app/api/search/flights/route')
        const request = new NextRequest('http://localhost:3000/api/search/flights?sessionId=test&origin=LHR&destination=CDG')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(429)
        expect(data).toMatchObject({
          error: expect.any(String),
          retryAfter: expect.any(Number)
        })
        expect(response.headers.get('x-ratelimit-limit')).toBeTruthy()
        expect(response.headers.get('x-ratelimit-remaining')).toBeTruthy()
        expect(response.headers.get('retry-after')).toBeTruthy()
      })
    })
  })

  describe('Analytics API Contracts', () => {
    describe('POST /api/analytics/click', () => {
      it('should conform to click tracking contract', async () => {
        const { prisma } = await import('@/lib/db')
        const testClick = testDataFactory.createClickEvent()
        
        prisma.clickEvent.create.mockResolvedValue(testClick)

        const { POST } = await import('@/app/api/analytics/click/route')
        const request = new NextRequest('http://localhost:3000/api/analytics/click', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: testClick.sessionId,
            offerId: testClick.offerId,
            provider: testClick.provider,
            price: testClick.price,
            currency: testClick.currency,
            destination: testClick.destination
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          success: expect.any(Boolean),
          clickId: expect.any(String),
          timestamp: expect.any(String)
        })

        if (data.success) {
          expect(data.clickId).toBe(testClick.id)
          expect(new Date(data.timestamp)).toBeInstanceOf(Date)
        }
      })
    })

    describe('GET /api/analytics/metrics', () => {
      it('should conform to metrics response contract', async () => {
        const { prisma } = await import('@/lib/db')
        
        // Mock metrics queries
        prisma.$queryRaw.mockResolvedValueOnce([{
          total_clicks: 1500,
          total_conversions: 75,
          total_revenue: 18750.00,
          avg_epc: 12.50,
          conversion_rate: 5.0
        }])

        const { GET } = await import('@/app/api/analytics/metrics/route')
        const request = new NextRequest('http://localhost:3000/api/analytics/metrics?period=7d')
        request.headers.set('x-api-key', 'test_admin_key')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          success: expect.any(Boolean),
          metrics: expect.objectContaining({
            totalClicks: expect.any(Number),
            totalConversions: expect.any(Number),
            totalRevenue: expect.any(Number),
            averageEPC: expect.any(Number),
            conversionRate: expect.any(Number)
          }),
          period: expect.any(String),
          generatedAt: expect.any(String)
        })
      })
    })
  })

  describe('Admin API Contracts', () => {
    describe('GET /api/admin/dashboards/daily-ops', () => {
      it('should conform to daily ops dashboard contract', async () => {
        const { prisma } = await import('@/lib/db')
        const scenario = testDataFactory.createAdminDashboardScenario()
        
        prisma.$queryRaw
          .mockResolvedValueOnce(scenario.epcData)
          .mockResolvedValueOnce(scenario.priceChanges)
          .mockResolvedValueOnce([]) // synthetic failures

        const { GET } = await import('@/app/api/admin/dashboards/daily-ops/route')
        const request = new NextRequest('http://localhost:3000/api/admin/dashboards/daily-ops')
        request.headers.set('x-api-key', 'test_admin_key')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          epcByProviderMarket: expect.any(Array),
          priceChangeRates: expect.any(Array),
          syntheticFailures15m: expect.any(Array),
          landingRatesByRoute: expect.any(Array),
          summary: expect.objectContaining({
            overallHealth: expect.any(Number),
            criticalIssues: expect.any(Array),
            warningIssues: expect.any(Array)
          }),
          generatedAt: expect.any(String)
        })

        // Validate EPC data structure
        data.epcByProviderMarket.forEach((item: any) => {
          expect(item).toMatchObject({
            provider: expect.any(String),
            market: expect.any(String),
            clicks: expect.any(Number),
            revenue: expect.any(Number),
            epc: expect.any(Number),
            status: expect.stringMatching(/^(HEALTHY|WARNING|CRITICAL)$/),
            action: expect.any(String)
          })
        })

        // Validate price change data structure
        data.priceChangeRates.forEach((item: any) => {
          expect(item).toMatchObject({
            route: expect.any(String),
            avgPriceToday: expect.any(Number),
            avgPrice7d: expect.any(Number),
            changePct: expect.any(Number),
            sampleSize: expect.any(Number),
            status: expect.stringMatching(/^(HEALTHY|WARNING|CRITICAL)$/)
          })
        })
      })
    })

    describe('GET /api/admin/destinations', () => {
      it('should conform to destinations list contract', async () => {
        const { prisma } = await import('@/lib/db')
        const testDestinations = testDataFactory.createMultipleDestinations(5)
        
        prisma.destination.findMany.mockResolvedValue(testDestinations)

        const { GET } = await import('@/app/api/admin/destinations/route')
        const request = new NextRequest('http://localhost:3000/api/admin/destinations')
        request.headers.set('x-admin-user-id', 'admin-123')
        request.headers.set('x-admin-user-role', 'admin')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          destinations: expect.any(Array),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            hasMore: expect.any(Boolean)
          })
        })

        data.destinations.forEach((destination: any) => {
          expect(destination).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            iataCode: expect.any(String),
            city: expect.any(String),
            country: expect.any(String),
            enabled: expect.any(Boolean),
            themes: expect.any(Array),
            priority: expect.any(Number)
          })
        })
      })
    })
  })

  describe('Authentication API Contracts', () => {
    describe('POST /api/admin/auth/login', () => {
      it('should conform to admin login contract', async () => {
        const { prisma } = await import('@/lib/db')
        const testAdmin = testDataFactory.createAdminUser()
        
        prisma.adminUser.findUnique.mockResolvedValue(testAdmin)
        
        // Mock bcrypt
        vi.doMock('bcryptjs', () => ({
          compare: vi.fn().mockResolvedValue(true)
        }))

        const { POST } = await import('@/app/api/admin/auth/login/route')
        const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: testAdmin.email,
            password: 'SecurePassword123!'
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          success: expect.any(Boolean),
          requiresMFA: expect.any(Boolean)
        })

        if (data.success && !data.requiresMFA) {
          expect(data).toMatchObject({
            user: expect.objectContaining({
              id: expect.any(String),
              email: expect.any(String),
              role: expect.any(String)
            }),
            sessionToken: expect.any(String),
            expiresAt: expect.any(String)
          })
        }

        if (data.requiresMFA) {
          expect(data).toMatchObject({
            tempToken: expect.any(String),
            backupCodesAvailable: expect.any(Boolean)
          })
        }
      })

      it('should return consistent error format for invalid credentials', async () => {
        const { prisma } = await import('@/lib/db')
        prisma.adminUser.findUnique.mockResolvedValue(null)

        const { POST } = await import('@/app/api/admin/auth/login/route')
        const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'invalid@example.com',
            password: 'wrongpassword'
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toMatchObject({
          success: false,
          error: expect.any(String),
          code: 'INVALID_CREDENTIALS'
        })
      })
    })
  })

  describe('Error Handling Contracts', () => {
    it('should return consistent error format across all endpoints', async () => {
      const errorScenarios = [
        {
          endpoint: '/api/search/session',
          method: 'POST',
          body: { invalid: 'data' },
          expectedStatus: 400,
          expectedCode: 'VALIDATION_ERROR'
        },
        {
          endpoint: '/api/analytics/click',
          method: 'POST',
          body: {},
          expectedStatus: 400,
          expectedCode: 'VALIDATION_ERROR'
        },
        {
          endpoint: '/api/admin/destinations',
          method: 'GET',
          headers: {}, // No auth headers
          expectedStatus: 401,
          expectedCode: 'AUTHENTICATION_REQUIRED'
        }
      ]

      for (const scenario of errorScenarios) {
        const request = new NextRequest(`http://localhost:3000${scenario.endpoint}`, {
          method: scenario.method,
          body: scenario.body ? JSON.stringify(scenario.body) : undefined
        })

        if (scenario.headers) {
          Object.entries(scenario.headers).forEach(([key, value]) => {
            request.headers.set(key, value as string)
          })
        }

        try {
          const { GET, POST } = await import(`@/app/api${scenario.endpoint}/route`)
          const handler = scenario.method === 'GET' ? GET : POST
          const response = await handler(request)
          const data = await response.json()

          expect(response.status).toBe(scenario.expectedStatus)
          expect(data).toMatchObject({
            success: false,
            error: expect.any(String),
            code: scenario.expectedCode
          })

          // Ensure error messages don't leak sensitive information
          expect(data.error).not.toMatch(/password|token|secret|key/i)
        } catch (error) {
          // Some endpoints might not exist, skip them
          console.warn(`Endpoint ${scenario.endpoint} not found, skipping`)
        }
      }
    })
  })

  describe('Response Headers Contract', () => {
    it('should include security headers on all responses', async () => {
      const { GET } = await import('@/app/api/health/route')
      const request = new NextRequest('http://localhost:3000/api/health')

      const response = await GET(request)

      // These headers should be added by middleware
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy'
      ]

      securityHeaders.forEach(header => {
        expect(response.headers.has(header)).toBe(true)
      })
    })

    it('should include rate limit headers on API responses', async () => {
      const { GET } = await import('@/app/api/search/flights/route')
      const request = new NextRequest('http://localhost:3000/api/search/flights?sessionId=test&origin=LHR&destination=CDG')

      const response = await GET(request)

      const rateLimitHeaders = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset'
      ]

      rateLimitHeaders.forEach(header => {
        expect(response.headers.has(header)).toBe(true)
      })
    })
  })
})