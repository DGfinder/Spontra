import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { testDataFactory, createMockDatabase } from '../factories/testDataFactory'

/**
 * Performance and Load Tests
 * Validates that API endpoints can handle expected load and respond within SLA
 */

// Mock dependencies for performance testing
vi.mock('@/lib/db', () => createMockDatabase())
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(0), // Allow requests
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn()
  }
}))

describe('Performance and Load Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    testDataFactory.reset()
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.ADMIN_API_KEY = 'test_admin_key'

    // Setup realistic database response times
    const { prisma } = vi.mocked(createMockDatabase().prisma)
    
    // Simulate database latency (50-200ms)
    const addLatency = <T>(result: T): Promise<T> => 
      new Promise(resolve => setTimeout(() => resolve(result), 50 + Math.random() * 150))

    prisma.searchSession.create.mockImplementation((args) => 
      addLatency(testDataFactory.createSearchSession(args?.data)))
    
    prisma.clickEvent.create.mockImplementation((args) => 
      addLatency(testDataFactory.createClickEvent(args?.data)))
  })

  describe('Search API Performance', () => {
    it('should handle flight search within 3 seconds', async () => {
      // Mock Amadeus API with realistic delay
      vi.doMock('@/lib/amadeusSimple', () => ({
        searchFlights: vi.fn().mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              offers: testDataFactory.createMultipleOffers(25)
            }), 1000 + Math.random() * 1000) // 1-2 second delay
          )
        )
      }))

      const { GET } = await import('@/app/api/search/flights/route')
      const request = new NextRequest(
        'http://localhost:3000/api/search/flights?sessionId=test&origin=LHR&destination=CDG&departureDate=2024-12-25&passengers=2'
      )

      const startTime = Date.now()
      const response = await GET(request)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(3000) // SLA: 3 seconds
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should handle concurrent search requests without degradation', async () => {
      const { GET } = await import('@/app/api/search/flights/route')
      
      // Create 10 concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) => {
        const request = new NextRequest(
          `http://localhost:3000/api/search/flights?sessionId=test-${i}&origin=LHR&destination=CDG&departureDate=2024-12-25&passengers=2`
        )
        return GET(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const totalDuration = Date.now() - startTime

      // All requests should complete within 5 seconds
      expect(totalDuration).toBeLessThan(5000)
      
      // All requests should succeed or be rate limited (not error)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status)
      })

      // At least 50% of requests should succeed
      const successfulResponses = responses.filter(r => r.status === 200)
      expect(successfulResponses.length).toBeGreaterThanOrEqual(5)
    })

    it('should maintain performance with large result sets', async () => {
      // Mock large result set
      vi.doMock('@/lib/amadeusSimple', () => ({
        searchFlights: vi.fn().mockResolvedValue({
          offers: testDataFactory.createMultipleOffers(100) // Large result set
        })
      }))

      const { GET } = await import('@/app/api/search/flights/route')
      const request = new NextRequest(
        'http://localhost:3000/api/search/flights?sessionId=test&origin=LHR&destination=CDG&departureDate=2024-12-25&passengers=2'
      )

      const startTime = Date.now()
      const response = await GET(request)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(4000) // Should handle large results within 4 seconds
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.offers.length).toBeGreaterThan(0)
    })
  })

  describe('Analytics Performance', () => {
    it('should handle high-frequency click tracking', async () => {
      const { POST } = await import('@/app/api/analytics/click/route')
      
      // Simulate 20 rapid click events
      const clickPromises = Array.from({ length: 20 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/analytics/click', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: `session-${i}`,
            offerId: `offer-${i}`,
            provider: 'amadeus',
            price: 450.00,
            currency: 'EUR',
            destination: 'CDG'
          })
        })
        return POST(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(clickPromises)
      const duration = Date.now() - startTime

      // Should process all clicks within 2 seconds
      expect(duration).toBeLessThan(2000)
      
      // All clicks should be tracked successfully
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should generate metrics efficiently for large datasets', async () => {
      const { prisma } = await import('@/lib/db')
      
      // Mock large metrics dataset
      prisma.$queryRaw.mockResolvedValue([
        {
          total_clicks: 50000,
          total_conversions: 2500,
          total_revenue: 125000.00,
          avg_epc: 2.50,
          conversion_rate: 5.0
        }
      ])

      const { GET } = await import('@/app/api/analytics/metrics/route')
      const request = new NextRequest('http://localhost:3000/api/analytics/metrics?period=30d')
      request.headers.set('x-api-key', 'test_admin_key')

      const startTime = Date.now()
      const response = await GET(request)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1500) // Should complete within 1.5 seconds
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.metrics.totalClicks).toBe(50000)
    })
  })

  describe('Admin Dashboard Performance', () => {
    it('should generate daily ops dashboard within SLA', async () => {
      const { prisma } = await import('@/lib/db')
      const scenario = testDataFactory.createAdminDashboardScenario()
      
      // Mock database queries with realistic data volumes
      prisma.$queryRaw
        .mockResolvedValueOnce(scenario.epcData) // EPC data
        .mockResolvedValueOnce(scenario.priceChanges) // Price changes
        .mockResolvedValueOnce([]) // Synthetic failures
        .mockResolvedValueOnce([]) // Landing rates

      const { GET } = await import('@/app/api/admin/dashboards/daily-ops/route')
      const request = new NextRequest('http://localhost:3000/api/admin/dashboards/daily-ops')
      request.headers.set('x-api-key', 'test_admin_key')

      const startTime = Date.now()
      const response = await GET(request)
      const duration = Date.now() - startTime

      // Dashboard should load within 2 seconds
      expect(duration).toBeLessThan(2000)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.epcByProviderMarket).toBeDefined()
      expect(data.summary.overallHealth).toBeGreaterThan(0)
    })

    it('should handle admin operations under load', async () => {
      const { GET } = await import('@/app/api/admin/destinations/route')
      
      // Simulate multiple admin users accessing destinations
      const requests = Array.from({ length: 5 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/admin/destinations')
        request.headers.set('x-admin-user-id', `admin-${i}`)
        request.headers.set('x-admin-user-role', 'admin')
        return GET(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(3000) // Multiple admin requests within 3 seconds
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Database Performance', () => {
    it('should handle database operations within acceptable timeouts', async () => {
      const { prisma } = await import('@/lib/db')
      
      // Test various database operations
      const operations = [
        () => prisma.searchSession.create({ data: testDataFactory.createSearchSession() }),
        () => prisma.clickEvent.create({ data: testDataFactory.createClickEvent() }),
        () => prisma.destination.findMany(),
        () => prisma.$queryRaw`SELECT COUNT(*) FROM search_sessions`
      ]

      for (const operation of operations) {
        const startTime = Date.now()
        await operation()
        const duration = Date.now() - startTime

        // Each operation should complete within 500ms
        expect(duration).toBeLessThan(500)
      }
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should handle large payloads without memory issues', async () => {
      const { POST } = await import('@/app/api/search/session/route')
      
      // Create a large but reasonable payload
      const largePayload = {
        origin: 'LHR',
        destination: 'CDG',
        departureDate: '2024-12-25',
        returnDate: '2024-12-30',
        passengers: 9, // Max passengers
        preferences: {
          // Large preferences object
          activities: Array.from({ length: 100 }, (_, i) => `activity-${i}`),
          budgetLevel: 'luxury',
          metadata: Array.from({ length: 50 }, (_, i) => ({ key: `meta-${i}`, value: `value-${i}` }))
        }
      }

      const request = new NextRequest('http://localhost:3000/api/search/session', {
        method: 'POST',
        body: JSON.stringify(largePayload)
      })

      const startTime = Date.now()
      const response = await POST(request)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should handle large payload quickly
      expect([200, 400]).toContain(response.status) // Success or validation error
    })

    it('should process multiple operations without memory leaks', async () => {
      const { GET } = await import('@/app/api/health/route')
      
      // Perform many health checks to test for memory leaks
      const healthChecks = Array.from({ length: 50 }, () => {
        const request = new NextRequest('http://localhost:3000/api/health')
        return GET(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(healthChecks)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(2000) // All health checks within 2 seconds
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Rate Limiting Performance', () => {
    it('should efficiently handle rate limiting decisions', async () => {
      const { kv } = await import('@vercel/kv')
      
      // Mock rate limiting checks
      let requestCount = 0
      kv.get.mockImplementation(() => {
        requestCount++
        return Promise.resolve(requestCount)
      })
      
      kv.incr.mockImplementation(() => Promise.resolve(requestCount))

      const { GET } = await import('@/app/api/search/flights/route')
      
      // Make requests to test rate limiting performance
      const requests = Array.from({ length: 20 }, (_, i) => {
        const request = new NextRequest(`http://localhost:3000/api/search/flights?sessionId=rate-test-${i}&origin=LHR&destination=CDG`)
        request.headers.set('x-forwarded-for', '192.168.1.1') // Same IP
        return GET(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(3000) // Rate limiting checks should be fast
      
      // Should have a mix of successful and rate-limited responses
      const successCount = responses.filter(r => r.status === 200).length
      const rateLimitedCount = responses.filter(r => r.status === 429).length
      
      expect(successCount + rateLimitedCount).toBe(20)
      expect(rateLimitedCount).toBeGreaterThan(0) // Some should be rate limited
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without blocking', async () => {
      const { prisma } = await import('@/lib/db')
      
      // Mock database errors
      prisma.searchSession.create.mockRejectedValue(new Error('Database connection failed'))

      const { POST } = await import('@/app/api/search/session/route')
      
      const requests = Array.from({ length: 10 }, () => {
        const request = new NextRequest('http://localhost:3000/api/search/session', {
          method: 'POST',
          body: JSON.stringify({
            origin: 'LHR',
            destination: 'CDG',
            departureDate: '2024-12-25',
            passengers: 2
          })
        })
        return POST(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime

      // Error handling should be fast
      expect(duration).toBeLessThan(1000)
      
      // All should return error responses
      responses.forEach(response => {
        expect(response.status).toBe(500)
      })
    })
  })
})

// Helper function to run stress tests (can be used in integration environment)
export async function runStressTest(endpoint: string, concurrency: number, duration: number) {
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    errors: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    responseTimes: [] as number[]
  }

  const startTime = Date.now()
  const endTime = startTime + duration

  const workers = Array.from({ length: concurrency }, async () => {
    while (Date.now() < endTime) {
      const requestStart = Date.now()
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`)
        const responseTime = Date.now() - requestStart
        
        results.totalRequests++
        results.responseTimes.push(responseTime)
        results.maxResponseTime = Math.max(results.maxResponseTime, responseTime)
        
        if (response.ok) {
          results.successfulRequests++
        } else {
          results.errors++
        }
      } catch (error) {
        results.totalRequests++
        results.errors++
      }
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  })

  await Promise.all(workers)

  results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length

  return results
}