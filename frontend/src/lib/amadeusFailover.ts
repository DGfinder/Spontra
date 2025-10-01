/**
 * Amadeus API Failover Strategy
 *
 * Implements multi-tier fallback strategy to handle Amadeus API failures:
 * 1. Primary: Amadeus API (with rate limiting)
 * 2. Secondary: Aggressive database caching (30min - 2hr)
 * 3. Tertiary: Fallback cached responses for popular routes
 * 4. Emergency: Mock data for development/critical failures
 */

import { AmadeusFlightOffer } from '@/types/amadeus'
import { db } from '@/server/db'
import { kv } from '@vercel/kv'
import crypto from 'crypto'

export interface FlightSearchRequest {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  travelClass: string
  nonStop?: boolean
}

export interface CachedFlightResponse {
  offers: AmadeusFlightOffer[]
  source: 'amadeus' | 'cache-redis' | 'cache-db' | 'fallback' | 'mock'
  cachedAt?: string
  expiresAt?: string
}

/**
 * Generate cache key for flight search
 */
function generateCacheKey(request: FlightSearchRequest): string {
  const normalized = {
    origin: request.origin.toUpperCase(),
    destination: request.destination.toUpperCase(),
    departureDate: request.departureDate,
    returnDate: request.returnDate || null,
    passengers: request.passengers,
    travelClass: request.travelClass,
    nonStop: request.nonStop || false
  }

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')

  return `flight:offers:${hash}`
}

/**
 * Check if route is popular (for aggressive caching)
 */
async function isPopularRoute(origin: string, destination: string): Promise<boolean> {
  try {
    const count = await db.popularRoute.findUnique({
      where: {
        originAirport_destinationAirport: {
          originAirport: origin.toUpperCase(),
          destinationAirport: destination.toUpperCase()
        }
      },
      select: { searchCount: true }
    })

    // Consider popular if searched more than 10 times
    return (count?.searchCount || 0) > 10
  } catch {
    return false
  }
}

/**
 * Get cached flight offers from Redis (fastest, 15min cache)
 */
async function getCachedOffersRedis(
  cacheKey: string
): Promise<AmadeusFlightOffer[] | null> {
  try {
    const cached = await kv.get<AmadeusFlightOffer[]>(cacheKey)
    if (cached) {
      console.log('[AmadeusFailover] Cache hit (Redis)', cacheKey.substring(0, 20))
      return cached
    }
  } catch (error) {
    console.error('[AmadeusFailover] Redis cache error:', error)
  }
  return null
}

/**
 * Get cached flight offers from database (30min - 2hr cache)
 */
async function getCachedOffersDB(
  request: FlightSearchRequest
): Promise<AmadeusFlightOffer[] | null> {
  try {
    const queryHash = generateCacheKey(request)

    const cached = await db.offerCache.findFirst({
      where: {
        queryHash,
        expiresAt: { gt: new Date() },
        isStale: false
      },
      select: {
        offers: true,
        createdAt: true
      }
    })

    if (cached) {
      console.log('[AmadeusFailover] Cache hit (Database)', queryHash.substring(0, 20))
      return cached.offers as unknown as AmadeusFlightOffer[]
    }
  } catch (error) {
    console.error('[AmadeusFailover] Database cache error:', error)
    Sentry.captureException(error, {
      tags: { module: 'amadeusFailover', layer: 'database' }
    })
  }
  return null
}

/**
 * Get stale cached offers (last resort fallback)
 */
async function getStaleOffersDB(
  request: FlightSearchRequest
): Promise<AmadeusFlightOffer[] | null> {
  try {
    const queryHash = generateCacheKey(request)

    const cached = await db.offerCache.findFirst({
      where: { queryHash },
      select: {
        offers: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (cached) {
      console.warn('[AmadeusFailover] Using stale cache', {
        age: Date.now() - new Date(cached.createdAt).getTime(),
        expired: new Date(cached.expiresAt)
      })
      return cached.offers as unknown as AmadeusFlightOffer[]
    }
  } catch (error) {
    console.error('[AmadeusFailover] Stale cache error:', error)
  }
  return null
}

/**
 * Store offers in cache (both Redis and DB)
 */
async function cacheOffers(
  request: FlightSearchRequest,
  offers: AmadeusFlightOffer[],
  ttlMinutes: number = 30
): Promise<void> {
  const cacheKey = generateCacheKey(request)
  const queryHash = cacheKey.replace('flight:offers:', '')

  try {
    // Store in Redis (fast, short-term)
    const redisTTL = Math.min(ttlMinutes, 15) * 60 // Max 15min in Redis
    await kv.setex(cacheKey, redisTTL, offers)

    // Store in Database (slower, longer-term)
    await db.offerCache.upsert({
      where: { id: queryHash },
      create: {
        id: queryHash,
        queryHash,
        market: 'AU', // TODO: Get from request context
        query: request as any,
        offers: offers as any,
        offerCount: offers.length,
        dataSource: 'amadeus',
        isStale: false,
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
      },
      update: {
        offers: offers as any,
        offerCount: offers.length,
        isStale: false,
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
        createdAt: new Date()
      }
    })

    console.log('[AmadeusFailover] Cached offers', {
      key: cacheKey.substring(0, 20),
      count: offers.length,
      ttl: ttlMinutes
    })
  } catch (error) {
    console.error('[AmadeusFailover] Cache storage error:', error)
    // Don't fail the main flow if caching fails
  }
}

/**
 * Main search function with failover strategy
 */
export async function searchFlightsWithFailover(
  request: FlightSearchRequest
): Promise<CachedFlightResponse> {
  const cacheKey = generateCacheKey(request)

  // Step 1: Try Redis cache (fastest)
  const redisCache = await getCachedOffersRedis(cacheKey)
  if (redisCache) {
    return {
      offers: redisCache,
      source: 'cache-redis'
    }
  }

  // Step 2: Try database cache (still fast)
  const dbCache = await getCachedOffersDB(request)
  if (dbCache) {
    // Backfill Redis cache
    kv.setex(cacheKey, 15 * 60, dbCache).catch(() => {})
    return {
      offers: dbCache,
      source: 'cache-db'
    }
  }

  // Step 3: Try Amadeus API
  try {
    const { amadeusClient } = await import('@/lib/amadeusSimple')

    if (!amadeusClient) {
      throw new Error('Amadeus client not configured')
    }

    const offers = await amadeusClient.searchFlights({
      origin: request.origin,
      destination: request.destination,
      departureDate: request.departureDate,
      returnDate: request.returnDate,
      adults: request.passengers,
      travelClass: request.travelClass as any,
      nonStop: request.nonStop,
      max: 20
    })

    if (!offers || offers.length === 0) {
      throw new Error('No offers returned from Amadeus')
    }

    // Determine cache TTL based on route popularity
    const isPopular = await isPopularRoute(request.origin, request.destination)
    const cacheTTL = isPopular ? 60 : 30 // 60min for popular, 30min for others

    // Cache the results
    await cacheOffers(request, offers, cacheTTL)

    return {
      offers,
      source: 'amadeus',
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + cacheTTL * 60 * 1000).toISOString()
    }
  } catch (error) {
    console.error('[AmadeusFailover] Amadeus API failed:', error)
    Sentry.captureException(error, {
      tags: { module: 'amadeusFailover', layer: 'api' },
      extra: { request }
    })

    // Step 4: Try stale cache (better than nothing)
    const staleCache = await getStaleOffersDB(request)
    if (staleCache) {
      Sentry.captureMessage('Using stale cache due to Amadeus failure', {
        level: 'warning',
        extra: { request }
      })
      return {
        offers: staleCache,
        source: 'fallback'
      }
    }

    // Step 5: Emergency fallback (development/critical failure)
    if (process.env.NODE_ENV === 'development' || process.env.FEATURE_ENABLE_MOCK_FALLBACKS === 'true') {
      console.warn('[AmadeusFailover] Using mock data as last resort')
      return {
        offers: generateMockOffers(request),
        source: 'mock'
      }
    }

    // No fallback available - throw error
    throw new Error('Flight search failed - no cache or API available')
  }
}

/**
 * Generate mock flight offers for development/emergency
 */
function generateMockOffers(request: FlightSearchRequest): AmadeusFlightOffer[] {
  const basePrice = 200 + Math.random() * 500

  return [
    {
      id: `mock-${Date.now()}-1`,
      price: {
        total: basePrice.toFixed(2),
        base: (basePrice * 0.8).toFixed(2),
        currency: 'EUR'
      },
      itineraries: [
        {
          duration: 'PT6H30M',
          segments: [
            {
              departure: {
                iataCode: request.origin,
                at: `${request.departureDate}T10:00:00`
              },
              arrival: {
                iataCode: request.destination,
                at: `${request.departureDate}T16:30:00`
              },
              carrierCode: 'XX',
              number: '1234',
              aircraft: { code: 'A320' }
            }
          ]
        }
      ],
      validatingAirlineCodes: ['XX']
    },
    {
      id: `mock-${Date.now()}-2`,
      price: {
        total: (basePrice * 1.2).toFixed(2),
        base: (basePrice).toFixed(2),
        currency: 'EUR'
      },
      itineraries: [
        {
          duration: 'PT5H15M',
          segments: [
            {
              departure: {
                iataCode: request.origin,
                at: `${request.departureDate}T14:00:00`
              },
              arrival: {
                iataCode: request.destination,
                at: `${request.departureDate}T19:15:00`
              },
              carrierCode: 'YY',
              number: '5678',
              aircraft: { code: 'B737' }
            }
          ]
        }
      ],
      validatingAirlineCodes: ['YY']
    }
  ] as any
}

/**
 * Warm cache for popular routes (run via cron)
 */
export async function warmCacheForPopularRoutes(): Promise<void> {
  try {
    const popularRoutes = await db.popularRoute.findMany({
      where: {
        searchCount: { gte: 10 }
      },
      take: 50,
      orderBy: { searchCount: 'desc' }
    })

    console.log(`[AmadeusFailover] Warming cache for ${popularRoutes.length} popular routes`)

    for (const route of popularRoutes) {
      // Get next 30 days of searches
      const today = new Date()
      for (let i = 1; i <= 30; i++) {
        const departureDate = new Date(today)
        departureDate.setDate(today.getDate() + i)

        const request: FlightSearchRequest = {
          origin: route.originAirport,
          destination: route.destinationAirport,
          departureDate: departureDate.toISOString().split('T')[0],
          passengers: 1,
          travelClass: 'ECONOMY'
        }

        try {
          await searchFlightsWithFailover(request)
          // Rate limit: wait 500ms between requests
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`[AmadeusFailover] Failed to warm ${route.originAirport}-${route.destinationAirport}:`, error)
        }
      }
    }

    console.log('[AmadeusFailover] Cache warming complete')
  } catch (error) {
    console.error('[AmadeusFailover] Cache warming error:', error)
    Sentry.captureException(error, {
      tags: { module: 'amadeusFailover', operation: 'warmCache' }
    })
  }
}