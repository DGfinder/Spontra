/**
 * Rate Limiting Utility
 *
 * Uses Vercel KV (Redis) for distributed rate limiting across serverless functions
 * Implements sliding window algorithm for accurate rate limiting
 */

import { kv } from '@vercel/kv'

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number

  /**
   * Time window in seconds
   */
  window: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp
}

/**
 * Predefined rate limit tiers
 */
export const RATE_LIMIT_TIERS = {
  // Auth endpoints - strict limits to prevent brute force
  AUTH: {
    limit: 10,
    window: 15 * 60, // 15 minutes
  },
  // API endpoints - moderate limits
  API: {
    limit: 100,
    window: 15 * 60, // 15 minutes
  },
  // Search endpoints - higher limits for core functionality
  SEARCH: {
    limit: 50,
    window: 15 * 60, // 15 minutes
  },
  // Very strict for sensitive operations
  SENSITIVE: {
    limit: 5,
    window: 15 * 60, // 15 minutes
  },
} as const

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const windowStart = now - config.window * 1000

  try {
    // Get all requests in the current window
    const requests = (await kv.zrange(key, windowStart, now, { byScore: true })) || []
    const requestCount = requests.length

    if (requestCount >= config.limit) {
      // Rate limit exceeded
      const oldestRequest = requests[0] || now
      const reset = Math.ceil((Number(oldestRequest) + config.window * 1000) / 1000)

      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset,
      }
    }

    // Add current request to the window
    await kv.zadd(key, { score: now, member: `${now}:${Math.random()}` })

    // Clean up old requests and set expiry
    await kv.zremrangebyscore(key, 0, windowStart)
    await kv.expire(key, config.window)

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - requestCount - 1,
      reset: Math.ceil((now + config.window * 1000) / 1000),
    }
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error)

    // On error, allow the request but log the error
    // This prevents rate limiting from breaking the app if KV is down
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Math.ceil((now + config.window * 1000) / 1000),
    }
  }
}

/**
 * Get client IP address from request
 *
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  // Check Vercel-specific headers first
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Create rate limit identifier from request
 *
 * Uses IP address for anonymous requests, user ID for authenticated requests
 *
 * @param request - Next.js request object
 * @param userId - Optional user ID for authenticated requests
 * @returns Rate limit identifier
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  const ip = getClientIp(request)
  return `ip:${ip}`
}
