import { kv } from '@vercel/kv'
import crypto from 'crypto'

/**
 * Travelpayouts API Caching Layer
 * Uses Vercel KV (Redis) to cache API responses and reduce API calls
 */

// Cache duration constants (in seconds)
export const CACHE_DURATIONS = {
  FLIGHTS: 60 * 60, // 1 hour - prices change frequently
  HOTELS: 60 * 60 * 24, // 24 hours - hotel prices more stable
  CALENDAR: 60 * 60 * 6, // 6 hours - calendar data semi-static
  ROUTES: 60 * 60 * 24 * 7, // 7 days - popular routes rarely change
  OFFERS: 60 * 60 * 6, // 6 hours - special offers moderate frequency
  DIRECT_FLIGHTS: 60 * 60 * 2 // 2 hours - direct flights moderate
} as const

/**
 * Generate cache key from endpoint and parameters
 */
function generateCacheKey(endpoint: string, params: Record<string, any>): string {
  // Sort params for consistent keys
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)

  // Create hash of parameters
  const paramsString = JSON.stringify(sortedParams)
  const paramsHash = crypto
    .createHash('md5')
    .update(paramsString)
    .digest('hex')
    .substring(0, 12)

  return `tp:${endpoint}:${paramsHash}`
}

/**
 * Get cached response or execute fetcher and cache result
 */
export async function getCachedResponse<T>(
  endpoint: string,
  params: Record<string, any>,
  fetcher: () => Promise<T>,
  cacheDuration: number = CACHE_DURATIONS.FLIGHTS
): Promise<T> {
  // Check if Vercel KV is configured
  if (!process.env.KV_URL) {
    console.warn('[Travelpayouts Cache] KV_URL not configured, skipping cache')
    return await fetcher()
  }

  const cacheKey = generateCacheKey(endpoint, params)

  try {
    // Try to get from cache
    const cached = await kv.get<T>(cacheKey)

    if (cached) {
      console.log(`[Travelpayouts Cache] HIT: ${cacheKey}`)
      return cached
    }

    console.log(`[Travelpayouts Cache] MISS: ${cacheKey}`)

    // Fetch fresh data
    const freshData = await fetcher()

    // Cache the result (fire and forget)
    kv.set(cacheKey, freshData, { ex: cacheDuration }).catch((err) => {
      console.error('[Travelpayouts Cache] Failed to cache response:', err)
    })

    return freshData
  } catch (error) {
    console.error('[Travelpayouts Cache] Error accessing cache:', error)
    // Fallback to direct fetch if cache fails
    return await fetcher()
  }
}

/**
 * Invalidate cache for specific endpoint and params
 */
export async function invalidateCache(
  endpoint: string,
  params: Record<string, any>
): Promise<void> {
  if (!process.env.KV_URL) {
    return
  }

  const cacheKey = generateCacheKey(endpoint, params)

  try {
    await kv.del(cacheKey)
    console.log(`[Travelpayouts Cache] INVALIDATED: ${cacheKey}`)
  } catch (error) {
    console.error('[Travelpayouts Cache] Failed to invalidate cache:', error)
  }
}

/**
 * Invalidate all caches for a specific endpoint (wildcard)
 */
export async function invalidateEndpoint(endpoint: string): Promise<void> {
  if (!process.env.KV_URL) {
    return
  }

  try {
    // Scan for all keys matching pattern
    const pattern = `tp:${endpoint}:*`
    const keys = await kv.keys(pattern)

    if (keys.length > 0) {
      await kv.del(...keys)
      console.log(`[Travelpayouts Cache] INVALIDATED ${keys.length} keys for ${endpoint}`)
    }
  } catch (error) {
    console.error('[Travelpayouts Cache] Failed to invalidate endpoint:', error)
  }
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(endpoint?: string): Promise<{
  totalKeys: number
  endpoints: Record<string, number>
}> {
  if (!process.env.KV_URL) {
    return { totalKeys: 0, endpoints: {} }
  }

  try {
    const pattern = endpoint ? `tp:${endpoint}:*` : 'tp:*'
    const keys = await kv.keys(pattern)

    // Count keys per endpoint
    const endpoints: Record<string, number> = {}
    keys.forEach((key) => {
      const parts = key.split(':')
      if (parts.length >= 2) {
        const endpointName = parts[1]
        endpoints[endpointName] = (endpoints[endpointName] || 0) + 1
      }
    })

    return {
      totalKeys: keys.length,
      endpoints
    }
  } catch (error) {
    console.error('[Travelpayouts Cache] Failed to get stats:', error)
    return { totalKeys: 0, endpoints: {} }
  }
}

/**
 * Clear all Travelpayouts caches (admin function)
 */
export async function clearAllCaches(): Promise<number> {
  if (!process.env.KV_URL) {
    return 0
  }

  try {
    const keys = await kv.keys('tp:*')

    if (keys.length > 0) {
      await kv.del(...keys)
      console.log(`[Travelpayouts Cache] CLEARED ${keys.length} total keys`)
      return keys.length
    }

    return 0
  } catch (error) {
    console.error('[Travelpayouts Cache] Failed to clear all caches:', error)
    return 0
  }
}

/**
 * Preload cache for popular routes (background job)
 */
export async function preloadPopularRoutes(
  routes: Array<{ origin: string; destination: string }>,
  fetcher: (origin: string, destination: string) => Promise<any>
): Promise<void> {
  if (!process.env.KV_URL) {
    return
  }

  console.log(`[Travelpayouts Cache] Preloading ${routes.length} popular routes...`)

  // Process in batches to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < routes.length; i += batchSize) {
    const batch = routes.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (route) => {
        try {
          await getCachedResponse(
            'prices_for_dates',
            { origin: route.origin, destination: route.destination },
            () => fetcher(route.origin, route.destination),
            CACHE_DURATIONS.ROUTES
          )
        } catch (error) {
          console.error(
            `[Travelpayouts Cache] Failed to preload ${route.origin}-${route.destination}:`,
            error
          )
        }
      })
    )

    // Rate limit: 1 batch per second
    if (i + batchSize < routes.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.log('[Travelpayouts Cache] Preload complete')
}
