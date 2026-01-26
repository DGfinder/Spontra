/**
 * Test Data Factory
 * Provides consistent, realistic test data for all test scenarios
 */

import { randomUUID } from 'crypto'

export interface TestUser {
  id: string
  email: string
  password?: string
  role: 'user' | 'admin' | 'moderator'
  createdAt: Date
  mfaEnabled?: boolean
}

export interface TestSearchSession {
  id: string
  userId?: string
  originAirport: string
  destinationAirport: string
  departureDate: Date
  returnDate?: Date
  passengers: number
  status: 'active' | 'completed' | 'expired'
  createdAt: Date
  updatedAt: Date
}

export interface TestFlightOffer {
  id: string
  price: {
    total: string
    currency: string
  }
  itineraries: Array<{
    segments: Array<{
      departure: { iataCode: string; at: string }
      arrival: { iataCode: string; at: string }
      carrierCode: string
      number: string
      duration: string
    }>
  }>
  travelerPricings: Array<{
    price: { total: string }
  }>
  provider: string
  validUntil: string
}

export interface TestDestination {
  id: string
  name: string
  iataCode: string
  city: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  timezone: string
  themes: string[]
  enabled: boolean
  priority: number
}

export interface TestClickEvent {
  id: string
  sessionId: string
  offerId: string
  provider: string
  price: number
  currency: string
  destination: string
  timestamp: Date
  userId?: string
}

export interface TestConversionEvent {
  id: string
  clickId: string
  bookingReference: string
  totalPrice: number
  currency: string
  commission: number
  timestamp: Date
}

export class TestDataFactory {
  private static instance: TestDataFactory
  private userCounter = 0
  private sessionCounter = 0
  private offerCounter = 0

  static getInstance(): TestDataFactory {
    if (!TestDataFactory.instance) {
      TestDataFactory.instance = new TestDataFactory()
    }
    return TestDataFactory.instance
  }

  // User factories
  createUser(overrides: Partial<TestUser> = {}): TestUser {
    this.userCounter++
    return {
      id: randomUUID(),
      email: `testuser${this.userCounter}@example.com`,
      password: 'SecurePassword123!',
      role: 'user',
      createdAt: new Date(),
      mfaEnabled: false,
      ...overrides
    }
  }

  createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
    return this.createUser({
      role: 'admin',
      email: `admin${this.userCounter}@spontra.com`,
      mfaEnabled: true,
      ...overrides
    })
  }

  // Search session factories
  createSearchSession(overrides: Partial<TestSearchSession> = {}): TestSearchSession {
    this.sessionCounter++
    const departureDate = new Date()
    departureDate.setDate(departureDate.getDate() + 30) // 30 days from now
    
    const returnDate = new Date(departureDate)
    returnDate.setDate(returnDate.getDate() + 7) // 7 day trip

    return {
      id: `session_${this.sessionCounter}_${randomUUID().slice(0, 8)}`,
      originAirport: 'LHR',
      destinationAirport: 'CDG',
      departureDate,
      returnDate,
      passengers: 2,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  createExpiredSession(overrides: Partial<TestSearchSession> = {}): TestSearchSession {
    const expiredDate = new Date()
    expiredDate.setHours(expiredDate.getHours() - 25) // 25 hours ago

    return this.createSearchSession({
      status: 'expired',
      createdAt: expiredDate,
      updatedAt: expiredDate,
      ...overrides
    })
  }

  // Flight offer factories
  createFlightOffer(overrides: Partial<TestFlightOffer> = {}): TestFlightOffer {
    this.offerCounter++
    const departureTime = new Date()
    departureTime.setDate(departureTime.getDate() + 30)
    departureTime.setHours(10, 0, 0, 0)

    const arrivalTime = new Date(departureTime)
    arrivalTime.setHours(13, 0, 0, 0) // 3 hour flight

    const validUntil = new Date()
    validUntil.setMinutes(validUntil.getMinutes() + 30) // Valid for 30 minutes

    return {
      id: `offer_${this.offerCounter}_${randomUUID().slice(0, 8)}`,
      price: {
        total: '450.00',
        currency: 'EUR'
      },
      itineraries: [{
        segments: [{
          departure: { 
            iataCode: 'LHR', 
            at: departureTime.toISOString() 
          },
          arrival: { 
            iataCode: 'CDG', 
            at: arrivalTime.toISOString() 
          },
          carrierCode: 'BA',
          number: '0308',
          duration: 'PT3H'
        }]
      }],
      travelerPricings: [{
        price: { total: '225.00' }
      }],
      provider: 'amadeus',
      validUntil: validUntil.toISOString(),
      ...overrides
    }
  }

  createBudgetOffer(overrides: Partial<TestFlightOffer> = {}): TestFlightOffer {
    return this.createFlightOffer({
      price: { total: '199.99', currency: 'EUR' },
      travelerPricings: [{ price: { total: '99.99' } }],
      provider: 'ryanair',
      ...overrides
    })
  }

  createLuxuryOffer(overrides: Partial<TestFlightOffer> = {}): TestFlightOffer {
    return this.createFlightOffer({
      price: { total: '1299.00', currency: 'EUR' },
      travelerPricings: [{ price: { total: '649.50' } }],
      provider: 'british_airways',
      ...overrides
    })
  }

  // Destination factories
  createDestination(overrides: Partial<TestDestination> = {}): TestDestination {
    const destinations = [
      { name: 'London', iataCode: 'LHR', city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.4700, lng: -0.4543, tz: 'Europe/London' },
      { name: 'Paris', iataCode: 'CDG', city: 'Paris', country: 'France', countryCode: 'FR', lat: 49.0097, lng: 2.5479, tz: 'Europe/Paris' },
      { name: 'Barcelona', iataCode: 'BCN', city: 'Barcelona', country: 'Spain', countryCode: 'ES', lat: 41.2971, lng: 2.0785, tz: 'Europe/Madrid' },
      { name: 'Amsterdam', iataCode: 'AMS', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', lat: 52.3086, lng: 4.7639, tz: 'Europe/Amsterdam' },
      { name: 'Rome', iataCode: 'FCO', city: 'Rome', country: 'Italy', countryCode: 'IT', lat: 41.8003, lng: 12.2389, tz: 'Europe/Rome' }
    ]

    const random = destinations[Math.floor(Math.random() * destinations.length)]

    return {
      id: randomUUID(),
      name: random.name,
      iataCode: random.iataCode,
      city: random.city,
      country: random.country,
      countryCode: random.countryCode,
      latitude: random.lat,
      longitude: random.lng,
      timezone: random.tz,
      themes: ['culture', 'sightseeing', 'restaurants'],
      enabled: true,
      priority: 100,
      ...overrides
    }
  }

  // Analytics event factories
  createClickEvent(overrides: Partial<TestClickEvent> = {}): TestClickEvent {
    return {
      id: `click_${randomUUID().slice(0, 8)}`,
      sessionId: `session_${randomUUID().slice(0, 8)}`,
      offerId: `offer_${randomUUID().slice(0, 8)}`,
      provider: 'amadeus',
      price: 450.00,
      currency: 'EUR',
      destination: 'CDG',
      timestamp: new Date(),
      ...overrides
    }
  }

  createConversionEvent(clickEvent: TestClickEvent, overrides: Partial<TestConversionEvent> = {}): TestConversionEvent {
    return {
      id: `conv_${randomUUID().slice(0, 8)}`,
      clickId: clickEvent.id,
      bookingReference: `BK${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      totalPrice: clickEvent.price,
      currency: clickEvent.currency,
      commission: clickEvent.price * 0.05, // 5% commission
      timestamp: new Date(),
      ...overrides
    }
  }

  // Batch data creation for performance testing
  createMultipleOffers(count: number, overrides: Partial<TestFlightOffer> = {}): TestFlightOffer[] {
    return Array.from({ length: count }, () => this.createFlightOffer(overrides))
  }

  createMultipleDestinations(count: number, overrides: Partial<TestDestination> = {}): TestDestination[] {
    return Array.from({ length: count }, () => this.createDestination(overrides))
  }

  createMultipleUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.createUser(overrides))
  }

  // Scenario-specific data sets
  createHighVolumeSearchScenario() {
    return {
      session: this.createSearchSession(),
      offers: this.createMultipleOffers(50),
      clicks: Array.from({ length: 10 }, () => this.createClickEvent()),
      conversions: [] // Will be populated based on clicks
    }
  }

  createAdminDashboardScenario() {
    const providers = ['amadeus', 'sabre', 'expedia', 'booking_com']
    const markets = ['UK', 'FR', 'DE', 'ES', 'IT']
    
    return {
      epcData: providers.flatMap(provider => 
        markets.map(market => ({
          provider,
          market,
          clicks: Math.floor(Math.random() * 1000) + 100,
          revenue: Math.floor(Math.random() * 50000) + 10000,
          epc: Math.floor(Math.random() * 50) + 10,
          changePctVs7d: (Math.random() - 0.5) * 40 // -20% to +20%
        }))
      ),
      priceChanges: [
        { route: 'LHR-CDG', avgPriceToday: 350, avgPrice7d: 320, changePct: 9.4, sampleSize: 45 },
        { route: 'LHR-BCN', avgPriceToday: 280, avgPrice7d: 290, changePct: -3.4, sampleSize: 67 },
        { route: 'CDG-FCO', avgPriceToday: 220, avgPrice7d: 200, changePct: 10.0, sampleSize: 89 }
      ]
    }
  }

  // Reset counters for test isolation
  reset(): void {
    this.userCounter = 0
    this.sessionCounter = 0
    this.offerCounter = 0
  }
}

// Export singleton instance
export const testDataFactory = TestDataFactory.getInstance()

// Helper functions for common test scenarios
// Singleton mock database for consistent mock state across tests
let _mockDbInstance: ReturnType<typeof createMockDatabase> | null = null

export const getMockDatabase = () => {
  if (!_mockDbInstance) {
    _mockDbInstance = createMockDatabase()
  }
  return _mockDbInstance
}

export const resetMockDatabase = () => {
  _mockDbInstance = null
}

export const createMockDatabase = () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    searchSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    clickEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    conversionEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    destination: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    adminUser: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    adminSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
})

export const createMockAmadeusClient = () => ({
  searchFlights: vi.fn(),
  getFlightDetails: vi.fn(),
  searchAirports: vi.fn(),
  searchDestinations: vi.fn()
})

export const createMockRedisClient = () => ({
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  exists: vi.fn()
})