import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock external dependencies
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    expire: vi.fn(),
    incr: vi.fn()
  }
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    searchSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    clickEvent: {
      create: vi.fn()
    },
    conversionEvent: {
      create: vi.fn()
    }
  }
}))

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => callback({ setTag: vi.fn(), setContext: vi.fn() }))
}))

describe('User Journey Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup common environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.AMADEUS_CLIENT_ID = 'test_client_id'
    process.env.AMADEUS_CLIENT_SECRET = 'test_client_secret'
    process.env.ADMIN_API_KEY = 'test_admin_key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Search to Booking Flow', () => {
    it('should handle the complete user journey from search to booking', async () => {
      // Mock database responses
      const { prisma } = await import('@/lib/db')
      const sessionId = 'test-session-123'
      const mockSession = {
        id: sessionId,
        user_id: null,
        origin_airport: 'LHR',
        destination_airport: 'CDG',
        departure_date: new Date('2024-12-25'),
        return_date: new Date('2024-12-30'),
        passengers: 2,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }

      prisma.searchSession.create.mockResolvedValue(mockSession)
      prisma.searchSession.findUnique.mockResolvedValue(mockSession)

      // Step 1: Initialize search session
      const { POST: createSession } = await import('@/app/api/search/session/route')
      const searchRequest = new NextRequest('http://localhost:3000/api/search/session', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'LHR',
          destination: 'CDG',
          departureDate: '2024-12-25',
          returnDate: '2024-12-30',
          passengers: 2
        })
      })

      const sessionResponse = await createSession(searchRequest)
      const sessionData = await sessionResponse.json()
      
      expect(sessionData.success).toBe(true)
      expect(sessionData.sessionId).toBe(sessionId)

      // Step 2: Search for flights
      const { GET: searchFlights } = await import('@/app/api/search/flights/route')
      const flightSearchRequest = new NextRequest(`http://localhost:3000/api/search/flights?sessionId=${sessionId}&origin=LHR&destination=CDG&departureDate=2024-12-25&returnDate=2024-12-30&passengers=2`)

      // Mock flight search results
      const mockFlightResults = {
        offers: [
          {
            id: 'offer_123',
            price: { total: '450.00', currency: 'EUR' },
            itineraries: [
              {
                segments: [{
                  departure: { iataCode: 'LHR', at: '2024-12-25T10:00:00' },
                  arrival: { iataCode: 'CDG', at: '2024-12-25T13:00:00' },
                  carrierCode: 'BA',
                  number: '0308'
                }]
              }
            ],
            travelerPricings: [{ price: { total: '225.00' } }]
          }
        ]
      }

      // Mock Amadeus API response
      vi.doMock('@/lib/amadeusSimple', () => ({
        searchFlights: vi.fn().mockResolvedValue(mockFlightResults)
      }))

      const flightResponse = await searchFlights(flightSearchRequest)
      const flightData = await flightResponse.json()

      expect(flightData.success).toBe(true)
      expect(flightData.offers).toHaveLength(1)
      expect(flightData.offers[0].price.total).toBe('450.00')

      // Step 3: Track click event
      const { POST: trackClick } = await import('@/app/api/analytics/click/route')
      const clickRequest = new NextRequest('http://localhost:3000/api/analytics/click', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          offerId: 'offer_123',
          provider: 'amadeus',
          price: 450.00,
          currency: 'EUR',
          destination: 'CDG'
        })
      })

      prisma.clickEvent.create.mockResolvedValue({
        id: 'click_123',
        session_id: sessionId,
        offer_id: 'offer_123',
        provider: 'amadeus',
        price: 450.00,
        currency: 'EUR'
      })

      const clickResponse = await trackClick(clickRequest)
      const clickData = await clickResponse.json()

      expect(clickData.success).toBe(true)
      expect(clickData.clickId).toBe('click_123')

      // Step 4: Generate booking redirect
      const { GET: redirectFlight } = await import('@/app/api/redirect/flight/route')
      const redirectRequest = new NextRequest(`http://localhost:3000/api/redirect/flight?clickId=click_123&provider=amadeus&offerId=offer_123`)

      const redirectResponse = await redirectFlight(redirectRequest)
      
      expect(redirectResponse.status).toBe(302)
      expect(redirectResponse.headers.get('location')).toContain('amadeus.com')

      // Step 5: Simulate conversion callback
      const { POST: trackConversion } = await import('@/app/api/webhooks/conversion/route')
      const conversionRequest = new NextRequest('http://localhost:3000/api/webhooks/conversion', {
        method: 'POST',
        body: JSON.stringify({
          clickId: 'click_123',
          bookingReference: 'BK789XYZ',
          totalPrice: 450.00,
          currency: 'EUR',
          commission: 22.50
        })
      })

      prisma.conversionEvent.create.mockResolvedValue({
        id: 'conversion_123',
        click_id: 'click_123',
        booking_reference: 'BK789XYZ',
        total_price: 450.00,
        currency: 'EUR',
        commission: 22.50
      })

      const conversionResponse = await trackConversion(conversionRequest)
      const conversionData = await conversionResponse.json()

      expect(conversionData.success).toBe(true)
      expect(conversionData.conversionId).toBe('conversion_123')

      // Verify all database interactions occurred
      expect(prisma.searchSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          origin_airport: 'LHR',
          destination_airport: 'CDG',
          passengers: 2
        })
      })
      expect(prisma.clickEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          session_id: sessionId,
          offer_id: 'offer_123',
          price: 450.00
        })
      })
      expect(prisma.conversionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          click_id: 'click_123',
          total_price: 450.00,
          commission: 22.50
        })
      })
    })

    it('should handle search errors gracefully', async () => {
      // Test error handling throughout the flow
      const { prisma } = await import('@/lib/db')
      
      // Mock database error
      prisma.searchSession.create.mockRejectedValue(new Error('Database connection failed'))

      const { POST: createSession } = await import('@/app/api/search/session/route')
      const searchRequest = new NextRequest('http://localhost:3000/api/search/session', {
        method: 'POST',
        body: JSON.stringify({
          origin: 'LHR',
          destination: 'CDG',
          departureDate: '2024-12-25',
          passengers: 2
        })
      })

      const sessionResponse = await createSession(searchRequest)
      const sessionData = await sessionResponse.json()

      expect(sessionData.success).toBe(false)
      expect(sessionData.error).toContain('Failed to create search session')
      expect(sessionResponse.status).toBe(500)
    })

    it('should handle invalid session data', async () => {
      const { POST: createSession } = await import('@/app/api/search/session/route')
      const invalidRequest = new NextRequest('http://localhost:3000/api/search/session', {
        method: 'POST',
        body: JSON.stringify({
          origin: '', // Invalid empty origin
          destination: 'CDG',
          departureDate: 'invalid-date',
          passengers: 0 // Invalid passenger count
        })
      })

      const response = await createSession(invalidRequest)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(response.status).toBe(400)
      expect(data.error).toContain('validation')
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits on search endpoints', async () => {
      const { kv } = await import('@vercel/kv')
      
      // Mock rate limit exceeded
      kv.get.mockResolvedValue(100) // Current count exceeds limit
      
      const { GET: searchFlights } = await import('@/app/api/search/flights/route')
      const request = new NextRequest('http://localhost:3000/api/search/flights?sessionId=test&origin=LHR&destination=CDG')
      
      // Add headers to simulate real request
      request.headers.set('x-forwarded-for', '192.168.1.1')
      
      const response = await searchFlights(request)
      
      expect(response.status).toBe(429)
      expect(response.headers.get('x-ratelimit-limit')).toBeTruthy()
      expect(response.headers.get('retry-after')).toBeTruthy()
    })
  })

  describe('Admin Operations Integration', () => {
    it('should generate daily ops metrics correctly', async () => {
      const { prisma } = await import('@/lib/db')
      
      // Mock database queries for metrics
      prisma.$queryRaw = vi.fn()
        .mockResolvedValueOnce([{ // EPC by provider
          provider: 'amadeus',
          market: 'UK',
          clicks: 100,
          revenue: 2500.00,
          epc: 25.00,
          change_pct_vs_7d: -5.2
        }])
        .mockResolvedValueOnce([{ // Price changes
          route: 'LHR-CDG',
          avg_price_today: 350.00,
          avg_price_7d: 320.00,
          change_pct: 9.4,
          sample_size: 45
        }])
        .mockResolvedValueOnce([{ // Synthetic failures
          endpoint: '/api/search/flights',
          failure_rate: 2.1,
          avg_response_time: 1200,
          last_failure: new Date()
        }])

      const { GET: dailyOps } = await import('@/app/api/admin/dashboards/daily-ops/route')
      const request = new NextRequest('http://localhost:3000/api/admin/dashboards/daily-ops')
      request.headers.set('x-api-key', 'test_admin_key')

      const response = await dailyOps(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.epcByProviderMarket).toBeDefined()
      expect(data.priceChangeRates).toBeDefined()
      expect(data.syntheticFailures15m).toBeDefined()
      expect(data.summary.overallHealth).toBeGreaterThan(0)
    })
  })

  describe('Security Integration', () => {
    it('should reject requests without proper authentication', async () => {
      const { GET: adminEndpoint } = await import('@/app/api/admin/destinations/route')
      const request = new NextRequest('http://localhost:3000/api/admin/destinations')
      // No authentication headers

      const response = await adminEndpoint(request)
      
      expect(response.status).toBe(401)
    })

    it('should validate CSRF tokens on state-changing operations', async () => {
      const { POST: createDestination } = await import('@/app/api/admin/destinations/route')
      const request = new NextRequest('http://localhost:3000/api/admin/destinations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Destination',
          iata_code: 'TST'
        })
      })
      // Missing CSRF token

      const response = await createDestination(request)
      
      expect(response.status).toBe(403)
    })
  })

  describe('Performance Integration', () => {
    it('should complete search operations within acceptable time limits', async () => {
      const startTime = Date.now()
      
      const { GET: searchFlights } = await import('@/app/api/search/flights/route')
      const request = new NextRequest('http://localhost:3000/api/search/flights?sessionId=perf-test&origin=LHR&destination=CDG')
      
      await searchFlights(request)
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle concurrent requests without degradation', async () => {
      const { GET: searchFlights } = await import('@/app/api/search/flights/route')
      
      const requests = Array.from({ length: 10 }, (_, i) => 
        searchFlights(new NextRequest(`http://localhost:3000/api/search/flights?sessionId=concurrent-${i}&origin=LHR&destination=CDG`))
      )
      
      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime
      
      expect(responses.every(r => r.status === 200 || r.status === 429)).toBe(true)
      expect(duration).toBeLessThan(10000) // All requests should complete within 10 seconds
    })
  })
})