/**
 * Multi-Tier Caching Strategy
 *
 * Layer 1: Redis/Vercel KV (5-15 min) - Hot cache for frequent queries
 * Layer 2: OfferCache Table (30+ min) - Deduplicated flight offers
 * Layer 3: Amadeus API (fallback) - Real-time data when cache misses
 *
 * Strategy:
 * 1. Check Redis first (fastest)
 * 2. Check database cache if Redis miss
 * 3. Fetch from Amadeus if both miss
 * 4. Store in both caches for next request
 */

import crypto from 'crypto'
import { kv } from '@vercel/kv'
import { db } from './db'
import { searchFlights, type FlightSearchParams, type AmadeusSearchResponse } from './amadeus'

// Re-export types for convenience
export type { FlightSearchParams, AmadeusSearchResponse } from './amadeus'

// ============================================================================
// Types
// ============================================================================

export interface NormalizedQuery {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  currencyCode: string
  max: number
}

export interface CacheMetrics {
  source: 'redis' | 'database' | 'amadeus'
  queryHash: string
  hitTime: number  // milliseconds
}

// ============================================================================
// Query Normalization & Hashing
// ============================================================================

/**
 * Normalize query parameters to ensure consistent caching
 * Removes optional undefined values, sorts keys, standardizes formats
 */
export function normalizeQuery(params: FlightSearchParams): NormalizedQuery {
  return {
    origin: params.origin.toUpperCase().trim(),
    destination: params.destination.toUpperCase().trim(),
    departureDate: params.departureDate,
    returnDate: params.returnDate || undefined,
    adults: params.adults,
    currencyCode: params.currencyCode || 'USD',
    max: params.max || 50
  }
}

/**
 * Generate SHA-256 hash of normalized query for cache key
 * Same query parameters always produce same hash (deterministic)
 */
export function generateQueryHash(query: NormalizedQuery): string {
  // Sort keys to ensure consistent ordering
  const sortedQuery = {
    adults: query.adults,
    currencyCode: query.currencyCode,
    departureDate: query.departureDate,
    destination: query.destination,
    max: query.max,
    origin: query.origin,
    ...(query.returnDate && { returnDate: query.returnDate })
  }

  const queryString = JSON.stringify(sortedQuery)
  return crypto.createHash('sha256').update(queryString).digest('hex')
}

// ============================================================================
// Multi-Tier Cache Operations
// ============================================================================

/**
 * Get cached flight offers with multi-tier fallback
 * Returns offers + cache metrics for monitoring
 */
export async function getCachedFlightOffers(
  params: FlightSearchParams
): Promise<{ offers: AmadeusSearchResponse; metrics: CacheMetrics }> {
  const startTime = Date.now()
  const normalized = normalizeQuery(params)
  const queryHash = generateQueryHash(normalized)

  // Layer 1: Check Redis/Vercel KV (fastest)
  // Skip if Redis not configured (local development)
  const hasRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  if (hasRedis) {
    try {
      const redisData = await kv.get<AmadeusSearchResponse>(`flight-offers:${queryHash}`)
      if (redisData) {
        console.log('[Cache] ✅ Redis HIT:', queryHash.substring(0, 12))
        return {
          offers: redisData,
          metrics: {
            source: 'redis',
            queryHash,
            hitTime: Date.now() - startTime
          }
        }
      }
      console.log('[Cache] ❌ Redis MISS')
    } catch (error) {
      console.error('[Cache] Redis error (continuing):', error)
    }
  } else {
    console.log('[Cache] ⏭️  Redis skipped (not configured)')
  }

  // Layer 2: Check Database Cache
  try {
    const dbCache = await db.offerCache.findFirst({
      where: {
        queryHash,
        expiresAt: { gt: new Date() },
        isStale: false
      }
    })

    if (dbCache && dbCache.offers) {
      console.log('[Cache] ✅ Database HIT:', queryHash.substring(0, 12))
      const offers = dbCache.offers as unknown as AmadeusSearchResponse

      // Backfill Redis for next request (fire-and-forget, if configured)
      if (hasRedis) {
        kv.setex(`flight-offers:${queryHash}`, 900, offers).catch(err => {
          console.error('[Cache] Redis backfill failed:', err)
        })
      }

      return {
        offers,
        metrics: {
          source: 'database',
          queryHash,
          hitTime: Date.now() - startTime
        }
      }
    }
    console.log('[Cache] ❌ Database MISS')
  } catch (error) {
    console.error('[Cache] Database error (continuing):', error)
  }

  // Layer 3: Fetch from Amadeus (cache miss)
  console.log('[Cache] 🌐 Fetching from Amadeus API')
  const offers = await searchFlights(params)

  // Store in both caches (parallel)
  const cachePromises: Promise<any>[] = [
    // Database: 30 minutes (always)
    db.offerCache.create({
      data: {
        queryHash,
        market: 'US', // TODO: Make configurable
        query: normalized as any, // Prisma Json type
        offers: offers as any,
        offerCount: offers.data.length,
        dataSource: 'amadeus',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
      }
    })
  ]

  // Redis: 15 minutes (if configured)
  if (hasRedis) {
    cachePromises.push(
      kv.setex(`flight-offers:${queryHash}`, 900, offers) as Promise<any>
    )
  }

  await Promise.allSettled(cachePromises)

  return {
    offers,
    metrics: {
      source: 'amadeus',
      queryHash,
      hitTime: Date.now() - startTime
    }
  }
}

/**
 * Invalidate cache for a specific query
 * Useful for testing or manual cache refresh
 */
export async function invalidateFlightCache(params: FlightSearchParams): Promise<void> {
  const normalized = normalizeQuery(params)
  const queryHash = generateQueryHash(normalized)

  const invalidatePromises: Promise<any>[] = [
    db.offerCache.updateMany({
      where: { queryHash },
      data: { isStale: true }
    })
  ]

  // Only delete from Redis if configured
  const hasRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  if (hasRedis) {
    invalidatePromises.push(
      kv.del(`flight-offers:${queryHash}`) as Promise<any>
    )
  }

  await Promise.allSettled(invalidatePromises)

  console.log('[Cache] 🗑️  Invalidated:', queryHash.substring(0, 12))
}

/**
 * Cleanup expired cache entries (run as cron job)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const result = await db.offerCache.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  })

  console.log(`[Cache] 🧹 Cleaned up ${result.count} expired entries`)
  return result.count
}

/**
 * Get cache statistics (for monitoring dashboard)
 */
export async function getCacheStats() {
  const now = new Date()

  const [total, valid, stale, expired] = await Promise.all([
    db.offerCache.count(),
    db.offerCache.count({
      where: {
        expiresAt: { gt: now },
        isStale: false
      }
    }),
    db.offerCache.count({
      where: { isStale: true }
    }),
    db.offerCache.count({
      where: { expiresAt: { lt: now } }
    })
  ])

  return {
    total,
    valid,
    stale,
    expired,
    hitRate: total > 0 ? (valid / total) * 100 : 0
  }
}
