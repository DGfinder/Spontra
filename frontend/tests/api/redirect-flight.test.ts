import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally for all tests
global.fetch = vi.fn()

// Mock Next.js request/response
const mockRequest = {
  json: vi.fn(),
  nextUrl: { origin: 'http://localhost:3000' },
  headers: { 
    get: vi.fn((header) => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'x-session-id': 'test-session-123',
        'referer': 'http://localhost:3000/flights'
      }
      return headers[header as keyof typeof headers] || null
    })
  }
}

const mockNextResponse = {
  json: vi.fn((data, options) => ({ data, options }))
}

// Mock environment variables
vi.mock('process', () => ({
  env: {
    AFFILIATE_KAYAK_ID: 'test-kayak-123',
    AFFILIATE_SKYSCANNER_ID: 'test-skyscanner-456',
    AFFILIATE_TRAVELPAYOUTS_ID: 'test-tp-789'
  }
}))

// Import the module after mocking
const { POST } = await import('@/app/api/redirect/flight/route')

describe('Flight Redirect API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful analytics call by default
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('Provider URL Builders', () => {
    const validRedirectData = {
      itineraryId: 'test-itinerary-123',
      origin: 'LHR',
      destination: 'BCN',
      departureDate: '2025-09-27',
      returnDate: '2025-10-04',
      adults: 2,
      cabinClass: 'ECONOMY' as const,
      carrierCode: 'BA',
      flightNumber: 'BA123',
      stops: 0,
      price: 299.99,
      currency: 'EUR'
    }

    it('should build British Airways airline direct URL', async () => {
      mockRequest.json.mockResolvedValueOnce(validRedirectData)
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(true)
      expect(response.data.provider).toBe('airline-BA')
      expect(response.data.url).toContain('britishairways.com')
      expect(response.data.url).toContain('from=LHR')
      expect(response.data.url).toContain('to=BCN')
      expect(response.data.url).toContain('depDate=2025-09-27')
      expect(response.data.url).toContain('adult=2')
    })

    it('should build Lufthansa airline direct URL', async () => {
      mockRequest.json.mockResolvedValueOnce({
        ...validRedirectData,
        carrierCode: 'LH'
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(true)
      expect(response.data.provider).toBe('airline-LH')
      expect(response.data.url).toContain('lufthansa.com')
      expect(response.data.url).toContain('origin=LHR')
      expect(response.data.url).toContain('destination=BCN')
      expect(response.data.url).toContain('departureDate=2025-09-27')
      expect(response.data.url).toContain('adults=2')
    })

    it('should fallback to aggregator for unsupported airline', async () => {
      mockRequest.json.mockResolvedValueOnce({
        ...validRedirectData,
        carrierCode: 'FR' // Ryanair - not supported for direct booking
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(true)
      expect(response.data.provider).toBe('kayak')
      expect(response.data.url).toContain('kayak.com')
      expect(response.data.url).toContain('LHR-BCN')
      expect(response.data.url).toContain('2025-09-27')
      expect(response.data.url).toContain('adults=2')
      expect(response.data.url).toContain('aid=test-kayak-123') // Affiliate ID
    })

    it('should include affiliate IDs in aggregator URLs', async () => {
      mockRequest.json.mockResolvedValueOnce({
        ...validRedirectData,
        carrierCode: 'FR' // Force aggregator fallback
      })
      
      const response = await POST(mockRequest as any)
      const url = response.data.url
      
      // Should contain Kayak affiliate ID (first fallback)
      expect(url).toContain('aid=test-kayak-123')
      expect(response.data.provider).toBe('kayak')
    })

    it('should handle one-way flights correctly', async () => {
      mockRequest.json.mockResolvedValueOnce({
        ...validRedirectData,
        returnDate: undefined // One-way flight
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(true)
      expect(response.data.url).not.toContain('retDate')
      expect(response.data.url).not.toContain('returnDate')
    })

    it('should handle cabin class mapping', async () => {
      mockRequest.json.mockResolvedValueOnce({
        ...validRedirectData,
        cabinClass: 'BUSINESS' as const
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(true)
      // Check that cabin class is properly mapped (depends on provider)
      expect(response.data.url).toMatch(/cabin|class/)
    })

    it('should clamp passenger count within limits', async () => {
      mockRequest.json.mockResolvedValueOnce({
        ...validRedirectData,
        adults: 12 // Exceeds max of 8
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(true)
      // Should be clamped to maximum allowed
      expect(response.data.url).toContain('adult=8') // BA format
    })
  })

  describe('Request Validation', () => {
    it('should reject invalid airport codes', async () => {
      mockRequest.json.mockResolvedValueOnce({
        itineraryId: 'test-123',
        origin: 'INVALID',
        destination: 'BCN',
        departureDate: '2025-09-27',
        adults: 1,
        cabinClass: 'ECONOMY',
        carrierCode: 'BA',
        flightNumber: 'BA123'
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(400)
      expect(response.data.error).toContain('Invalid')
    })

    it('should reject missing required fields', async () => {
      mockRequest.json.mockResolvedValueOnce({
        // Missing itineraryId, origin, etc.
        destination: 'BCN'
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(400)
    })

    it('should reject invalid date formats', async () => {
      mockRequest.json.mockResolvedValueOnce({
        itineraryId: 'test-123',
        origin: 'LHR',
        destination: 'BCN',
        departureDate: 'invalid-date',
        adults: 1,
        cabinClass: 'ECONOMY',
        carrierCode: 'BA',
        flightNumber: 'BA123'
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(400)
    })
  })

  describe('Analytics Integration', () => {
    it('should log analytics event on successful redirect', async () => {
      const validData = {
        itineraryId: 'test-123',
        origin: 'LHR',
        destination: 'BCN',
        departureDate: '2025-09-27',
        adults: 1,
        cabinClass: 'ECONOMY' as const,
        carrierCode: 'BA',
        flightNumber: 'BA123'
      }
      
      mockRequest.json.mockResolvedValueOnce(validData)
      
      await POST(mockRequest as any)
      
      // Should have made analytics call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/api/analytics/click'
        }),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"partnerId":"airline-BA"')
        })
      )
    })

    it('should not fail if analytics logging fails', async () => {
      // Mock analytics endpoint to fail
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Analytics service down'))
      
      const validData = {
        itineraryId: 'test-123',
        origin: 'LHR',
        destination: 'BCN',
        departureDate: '2025-09-27',
        adults: 1,
        cabinClass: 'ECONOMY' as const,
        carrierCode: 'BA',
        flightNumber: 'BA123'
      }
      
      mockRequest.json.mockResolvedValueOnce(validData)
      
      const response = await POST(mockRequest as any)
      
      // Should still succeed despite analytics failure
      expect(response.data.ok).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle request parsing errors', async () => {
      mockRequest.json.mockRejectedValueOnce(new Error('Invalid JSON'))
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(500)
      expect(response.data.error).toContain('Unable to prepare booking redirect')
    })

    it('should return 503 when no providers available', async () => {
      // Mock all URL builders to return null
      mockRequest.json.mockResolvedValueOnce({
        itineraryId: 'test-123',
        origin: 'XXX', // Invalid airport that would break URL building
        destination: 'YYY',
        departureDate: '2025-09-27',
        adults: 1,
        cabinClass: 'ECONOMY' as const,
        carrierCode: 'XX', // Invalid carrier
        flightNumber: 'XX999'
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(false)
      expect(response.options.status).toBe(503)
    })
  })
})

describe('Provider URL Utility Functions', () => {
  // These would test individual URL builder functions if exported
  // For now, we test them through the main API endpoint
  
  it('should sanitize dates correctly', async () => {
    mockRequest.json.mockResolvedValueOnce({
      itineraryId: 'test-123',
      origin: 'LHR',
      destination: 'BCN',
      departureDate: '2025-09-27T10:30:00Z', // Full ISO date
      adults: 1,
      cabinClass: 'ECONOMY' as const,
      carrierCode: 'BA',
      flightNumber: 'BA123'
    })
    
    const response = await POST(mockRequest as any)
    
    expect(response.data.ok).toBe(true)
    // Should extract just the date part
    expect(response.data.url).toContain('2025-09-27')
    expect(response.data.url).not.toContain('T10:30:00Z')
  })

  it('should map cabin classes correctly for different providers', async () => {
    const testCases = [
      { cabin: 'ECONOMY' as const, expectedInUrl: true },
      { cabin: 'PREMIUM_ECONOMY' as const, expectedInUrl: true },
      { cabin: 'BUSINESS' as const, expectedInUrl: true },
      { cabin: 'FIRST' as const, expectedInUrl: true }
    ]

    for (const testCase of testCases) {
      mockRequest.json.mockResolvedValueOnce({
        itineraryId: 'test-123',
        origin: 'LHR',
        destination: 'BCN',
        departureDate: '2025-09-27',
        adults: 1,
        cabinClass: testCase.cabin,
        carrierCode: 'BA',
        flightNumber: 'BA123'
      })
      
      const response = await POST(mockRequest as any)
      
      expect(response.data.ok).toBe(true)
      // URL should contain some form of cabin class parameter
      if (testCase.expectedInUrl) {
        expect(response.data.url).toMatch(/cabin|class/i)
      }
    }
  })
})