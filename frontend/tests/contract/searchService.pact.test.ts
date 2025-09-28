/**
 * Contract Tests for Search Service
 * Validates API compatibility between frontend and search microservice
 */

import { Pact, Matchers } from '@pact-foundation/pact'
import { describe, beforeAll, afterEach, afterAll, test, expect } from 'vitest'
import { searchServicePactOptions } from './pact.config'

const { like, eachLike, term, boolean, integer } = Matchers

describe('Search Service Contract Tests', () => {
  const provider = new Pact(searchServicePactOptions)

  beforeAll(async () => {
    await provider.setup()
  })

  afterEach(async () => {
    await provider.verify()
  })

  afterAll(async () => {
    await provider.finalize()
  })

  describe('Flight Search API', () => {
    test('should search for flights successfully', async () => {
      const expectedResponse = {
        success: true,
        data: {
          offers: eachLike({
            id: like('flight_001'),
            price: {
              total: like('299.99'),
              currency: like('EUR'),
              grandTotal: like('299.99')
            },
            itineraries: eachLike({
              duration: like('PT2H30M'),
              segments: eachLike({
                departure: {
                  iataCode: like('CDG'),
                  at: like('2024-12-01T10:00:00')
                },
                arrival: {
                  iataCode: like('LHR'),
                  at: like('2024-12-01T12:30:00')
                },
                carrierCode: like('AF'),
                number: like('1234'),
                aircraft: {
                  code: like('320')
                },
                duration: like('PT2H30M'),
                numberOfStops: integer(0)
              })
            }),
            validatingAirlineCodes: eachLike(like('AF')),
            provider: like('amadeus')
          }),
          meta: {
            count: integer(5),
            searchId: like('search_123'),
            cached: boolean(false)
          }
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('flight offers are available for CDG to LHR route')
        .uponReceiving('a request for flight search')
        .withRequest({
          method: 'POST',
          path: '/api/search/flights',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: {
            origin: 'CDG',
            destination: 'LHR',
            departureDate: '2024-12-01',
            adults: 1,
            children: 0,
            infants: 0,
            travelClass: 'ECONOMY'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/search/flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          origin: 'CDG',
          destination: 'LHR',
          departureDate: '2024-12-01',
          adults: 1,
          children: 0,
          infants: 0,
          travelClass: 'ECONOMY'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.offers).toBeDefined()
      expect(data.data.meta.count).toBeGreaterThan(0)
    })

    test('should handle search with no results', async () => {
      const expectedResponse = {
        success: true,
        data: {
          offers: [],
          meta: {
            count: 0,
            searchId: like('search_456'),
            cached: boolean(false)
          },
          warnings: eachLike({
            code: like('NO_OFFERS'),
            title: like('No flights found'),
            detail: like('No flights available for the specified route and date')
          })
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('no flight offers are available for remote route')
        .uponReceiving('a request for flight search with no results')
        .withRequest({
          method: 'POST',
          path: '/api/search/flights',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            origin: 'XYZ',
            destination: 'ABC',
            departureDate: '2024-12-01',
            adults: 1
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/search/flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: 'XYZ',
          destination: 'ABC',
          departureDate: '2024-12-01',
          adults: 1
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.offers).toHaveLength(0)
      expect(data.data.warnings).toBeDefined()
    })

    test('should handle search validation errors', async () => {
      const expectedResponse = {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: eachLike({
          field: like('origin'),
          message: like('Origin airport code is required'),
          code: like('REQUIRED')
        }),
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('search request has validation errors')
        .uponReceiving('a request with invalid search parameters')
        .withRequest({
          method: 'POST',
          path: '/api/search/flights',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            destination: 'LHR',
            departureDate: '2024-12-01'
            // Missing origin and adults
          }
        })
        .willRespondWith({
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/search/flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination: 'LHR',
          departureDate: '2024-12-01'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.details).toBeDefined()
    })
  })

  describe('Search Session API', () => {
    test('should create search session successfully', async () => {
      const expectedResponse = {
        success: true,
        data: {
          sessionId: like('session_789'),
          expiresAt: like('2024-12-01T11:00:00.000Z'),
          searchCriteria: {
            origin: like('CDG'),
            destination: like('LHR'),
            departureDate: like('2024-12-01'),
            passengers: {
              adults: integer(1),
              children: integer(0),
              infants: integer(0)
            }
          }
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('search session can be created')
        .uponReceiving('a request to create search session')
        .withRequest({
          method: 'POST',
          path: '/api/search/session',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            origin: 'CDG',
            destination: 'LHR',
            departureDate: '2024-12-01',
            returnDate: null,
            passengers: {
              adults: 1,
              children: 0,
              infants: 0
            },
            travelClass: 'ECONOMY'
          }
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/search/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: 'CDG',
          destination: 'LHR',
          departureDate: '2024-12-01',
          returnDate: null,
          passengers: {
            adults: 1,
            children: 0,
            infants: 0
          },
          travelClass: 'ECONOMY'
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.sessionId).toBeDefined()
      expect(data.data.searchCriteria).toBeDefined()
    })
  })

  describe('Airport Search API', () => {
    test('should search airports by keyword', async () => {
      const expectedResponse = {
        success: true,
        data: {
          airports: eachLike({
            iataCode: like('CDG'),
            name: like('Charles de Gaulle Airport'),
            city: like('Paris'),
            country: like('France'),
            countryCode: like('FR'),
            geoCode: {
              latitude: like(49.0097),
              longitude: like(2.5479)
            }
          }),
          query: like('paris'),
          count: integer(5)
        },
        timestamp: like('2024-12-01T10:00:00.000Z')
      }

      await provider
        .given('airports matching query exist')
        .uponReceiving('a request to search airports')
        .withRequest({
          method: 'GET',
          path: '/api/search/airports',
          query: 'q=paris&limit=10'
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        })

      const response = await fetch(`${provider.mockService.baseUrl}/api/search/airports?q=paris&limit=10`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.airports).toBeDefined()
      expect(data.data.count).toBeGreaterThan(0)
    })
  })
})