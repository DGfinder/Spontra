/**
 * Contract Tests for Admin Service
 * Validates API compatibility between frontend and admin microservice
 */

import { Pact, Matchers } from '@pact-foundation/pact'
import { describe, beforeAll, afterEach, afterAll, test, expect } from 'vitest'
import { adminServicePactOptions } from './pact.config'

const { like, eachLike, term, boolean, integer } = Matchers

describe('Admin Service Contract Tests', () => {
  const provider = new Pact(adminServicePactOptions)

  beforeAll(async () => {
    await provider.setup()
  })

  afterEach(async () => {
    await provider.verify()
  })

  afterAll(async () => {
    await provider.finalize()
  })

  describe('Admin Authentication API', () => {
    test('should authenticate admin user successfully', async () => {
      const expectedResponse = {
        success: true,
        data: {
          user: {
            id: like('admin_123'),
            email: like('admin@spontra.com'),
            role: like('admin'),
            permissions: eachLike(like('destinations:write')),
            lastLoginAt: like('2024-12-01T10:00:00.000Z')
          },
          token: like('jwt_token_here'),
          expiresAt: like('2024-12-01T18:00:00.000Z')
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('admin user exists with valid credentials')
        .uponReceiving('a request to authenticate admin user')
        .withRequest({
          method: 'POST',
          path: '/api/admin/auth/login',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            email: 'admin@spontra.com',
            password: 'secure_password',
            mfaCode: '123456'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@spontra.com',
          password: 'secure_password',
          mfaCode: '123456'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.user.role).toBe('admin')
      expect(data.data.token).toBeDefined()
    })

    test('should reject invalid credentials', async () => {
      const expectedResponse = {
        success: false,
        error: 'Invalid credentials',
        code: 'AUTHENTICATION_FAILED',
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('admin user has invalid credentials')
        .uponReceiving('a request with invalid admin credentials')
        .withRequest({
          method: 'POST',
          path: '/api/admin/auth/login',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            email: 'admin@spontra.com',
            password: 'wrong_password'
          }
        })
        .willRespondWith({
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@spontra.com',
          password: 'wrong_password'
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('AUTHENTICATION_FAILED')
    })
  })

  describe('Destinations Management API', () => {
    test('should retrieve destinations list', async () => {
      const expectedResponse = {
        success: true,
        data: {
          destinations: eachLike({
            id: like('dest_123'),
            iataCode: like('PAR'),
            name: like('Paris'),
            country: like('France'),
            themes: eachLike({
              id: like('theme_123'),
              name: like('romantic'),
              mediaCount: integer(5)
            }),
            status: like('active'),
            lastUpdated: like('2024-12-01T10:00:00.000Z')
          }),
          pagination: {
            page: integer(1),
            limit: integer(25),
            total: integer(100),
            totalPages: integer(4)
          }
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('admin user is authenticated')
        .uponReceiving('a request to list destinations')
        .withRequest({
          method: 'GET',
          path: '/api/admin/destinations',
          headers: {
            'Authorization': term({
              matcher: 'Bearer [A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+',
              generate: 'Bearer jwt.token.here'
            }),
            'Accept': 'application/json'
          },
          query: 'page=1&limit=25'
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/admin/destinations?page=1&limit=25`, {
        headers: {
          'Authorization': 'Bearer jwt.token.here',
          'Accept': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.destinations).toBeDefined()
      expect(data.data.pagination).toBeDefined()
    })

    test('should create new destination', async () => {
      const expectedResponse = {
        success: true,
        data: {
          destination: {
            id: like('dest_456'),
            iataCode: like('BCN'),
            name: like('Barcelona'),
            country: like('Spain'),
            description: like('Beautiful Mediterranean city'),
            geoCode: {
              latitude: like(41.3851),
              longitude: like(2.1734)
            },
            status: like('active'),
            createdAt: like('2024-12-01T10:00:00.000Z'),
            updatedAt: like('2024-12-01T10:00:00.000Z')
          }
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('admin user has destination creation permissions')
        .uponReceiving('a request to create a new destination')
        .withRequest({
          method: 'POST',
          path: '/api/admin/destinations',
          headers: {
            'Authorization': term({
              matcher: 'Bearer [A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+',
              generate: 'Bearer jwt.token.here'
            }),
            'Content-Type': 'application/json'
          },
          body: {
            iataCode: 'BCN',
            name: 'Barcelona',
            country: 'Spain',
            description: 'Beautiful Mediterranean city',
            geoCode: {
              latitude: 41.3851,
              longitude: 2.1734
            }
          }
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/admin/destinations`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer jwt.token.here',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          iataCode: 'BCN',
          name: 'Barcelona',
          country: 'Spain',
          description: 'Beautiful Mediterranean city',
          geoCode: {
            latitude: 41.3851,
            longitude: 2.1734
          }
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.destination.iataCode).toBe('BCN')
    })
  })

  describe('System Monitoring API', () => {
    test('should retrieve system health status', async () => {
      const expectedResponse = {
        success: true,
        data: {
          status: like('healthy'),
          services: {
            database: {
              status: like('healthy'),
              responseTime: integer(25),
              lastCheck: like('2024-12-01T10:00:00.000Z')
            },
            cache: {
              status: like('healthy'),
              responseTime: integer(5),
              lastCheck: like('2024-12-01T10:00:00.000Z')
            },
            amadeus: {
              status: like('degraded'),
              responseTime: integer(1500),
              lastCheck: like('2024-12-01T10:00:00.000Z'),
              circuitBreakerState: like('half_open')
            }
          },
          metrics: {
            uptime: like('99.98%'),
            averageResponseTime: integer(125),
            requestsPerMinute: integer(450)
          }
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('system health data is available')
        .uponReceiving('a request for system health status')
        .withRequest({
          method: 'GET',
          path: '/api/admin/system/health',
          headers: {
            'Authorization': term({
              matcher: 'Bearer [A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+',
              generate: 'Bearer jwt.token.here'
            }),
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/admin/system/health`, {
        headers: {
          'Authorization': 'Bearer jwt.token.here',
          'Accept': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBeDefined()
      expect(data.data.services).toBeDefined()
      expect(data.data.metrics).toBeDefined()
    })
  })

  describe('Analytics API', () => {
    test('should retrieve conversion metrics', async () => {
      const expectedResponse = {
        success: true,
        data: {
          period: like('24h'),
          conversions: {
            total: integer(125),
            rate: like(2.8),
            revenue: like('15750.00'),
            currency: like('EUR')
          },
          topRoutes: eachLike({
            origin: like('CDG'),
            destination: like('LHR'),
            conversions: integer(25),
            revenue: like('3250.00')
          }),
          providers: eachLike({
            name: like('amadeus'),
            conversions: integer(85),
            rate: like(3.2),
            revenue: like('11200.00')
          })
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('conversion metrics are available')
        .uponReceiving('a request for conversion analytics')
        .withRequest({
          method: 'GET',
          path: '/api/admin/analytics/conversions',
          headers: {
            'Authorization': term({
              matcher: 'Bearer [A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+',
              generate: 'Bearer jwt.token.here'
            }),
            'Accept': 'application/json'
          },
          query: 'period=24h'
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/admin/analytics/conversions?period=24h`, {
        headers: {
          'Authorization': 'Bearer jwt.token.here',
          'Accept': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.conversions).toBeDefined()
      expect(data.data.topRoutes).toBeDefined()
      expect(data.data.providers).toBeDefined()
    })
  })
})