/**
 * Test Setup Configuration
 * Global setup for all tests including mocks, environment variables, and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { testDataFactory } from './factories/testDataFactory'

// Global test environment setup
beforeAll(() => {
  // Set up environment variables for tests
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.ADMIN_API_KEY = 'test_admin_key'
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing'
  process.env.AMADEUS_CLIENT_ID = 'test_amadeus_client_id'
  process.env.AMADEUS_CLIENT_SECRET = 'test_amadeus_client_secret'
  process.env.RESEND_API_KEY = 'test_resend_key'
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test/webhook'
  process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123456'
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  
  // Global error handler for unhandled promises
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })
})

afterAll(() => {
  // Restore console methods
  vi.restoreAllMocks()
  
  // Clean up any global state
  testDataFactory.reset()
})

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Reset test data factory counters
  testDataFactory.reset()
  
  // Clear any cached modules
  vi.resetModules()
})

afterEach(() => {
  // Clean up any test-specific state
  vi.clearAllTimers()
  vi.useRealTimers()
})

// Global mock implementations for common dependencies

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: vi.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: () => Promise.resolve(JSON.parse(init?.body || '{}')),
    ...init
  })),
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map(),
      ...init
    })),
    redirect: vi.fn((url, status = 302) => ({
      status,
      headers: new Map([['location', url]])
    })),
    next: vi.fn(() => ({
      status: 200,
      headers: new Map()
    }))
  }
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams())
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(() => [])
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    entries: vi.fn(() => [])
  }))
}))

// Mock external APIs and services
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => {
    const scope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
      setLevel: vi.fn(),
      setUser: vi.fn()
    }
    callback(scope)
  }),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  startTransaction: vi.fn(() => ({
    setTag: vi.fn(),
    finish: vi.fn()
  })),
  metrics: {
    increment: vi.fn()
  }
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        id: 'test-email-id',
        to: 'test@example.com'
      })
    }
  }))
}))

// Mock crypto functions
vi.mock('crypto', async () => {
  const actual = await vi.importActual('crypto')
  return {
    ...actual,
    randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substring(2))
  }
})

// Mock bcrypt for password hashing
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
  genSalt: vi.fn().mockResolvedValue('salt')
}))

// Mock jose for JWT handling
vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setSubject: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock.jwt.token')
  })),
  jwtVerify: vi.fn().mockResolvedValue({
    payload: {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    }
  }),
  importJWK: vi.fn(),
  base64url: {
    decode: vi.fn(),
    encode: vi.fn()
  }
}))

// Test utilities
export const testUtils = {
  // Helper to create mock request with proper headers
  createMockRequest: (url: string, options: any = {}) => {
    const request = new Request(url, options)
    
    // Add common test headers
    request.headers.set('x-forwarded-for', '127.0.0.1')
    request.headers.set('user-agent', 'test-agent')
    
    return request
  },
  
  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create realistic test data
  createTestScenario: (type: 'search' | 'booking' | 'admin' | 'analytics') => {
    switch (type) {
      case 'search':
        return {
          session: testDataFactory.createSearchSession(),
          offers: testDataFactory.createMultipleOffers(5)
        }
      case 'booking':
        const clickEvent = testDataFactory.createClickEvent()
        return {
          click: clickEvent,
          conversion: testDataFactory.createConversionEvent(clickEvent)
        }
      case 'admin':
        return testDataFactory.createAdminDashboardScenario()
      case 'analytics':
        return {
          clicks: Array.from({ length: 10 }, () => testDataFactory.createClickEvent()),
          conversions: Array.from({ length: 3 }, () => testDataFactory.createConversionEvent(testDataFactory.createClickEvent()))
        }
    }
  }
}

// Export commonly used mocks
export { testDataFactory }

// Global test timeout configuration
vi.setConfig({
  testTimeout: 10000, // 10 seconds
  hookTimeout: 10000
})