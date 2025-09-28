import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  message?: string
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many attempts. Please try again later.'
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0].trim() || realIp || 'unknown'
  return clientIp
}

export function createRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return (request: NextRequest, identifier?: string): { limited: boolean; response?: NextResponse } => {
    const clientIp = getClientIp(request)
    const key = identifier ? `${clientIp}-${identifier}` : clientIp
    const now = Date.now()

    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k]
      }
    })

    // Get or create entry for this client
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + finalConfig.windowMs
      }
    }

    const entry = store[key]

    // Reset if window has expired
    if (entry.resetTime < now) {
      entry.count = 0
      entry.resetTime = now + finalConfig.windowMs
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > finalConfig.maxAttempts) {
      const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000)
      
      return {
        limited: true,
        response: NextResponse.json(
          {
            ok: false,
            error: 'rate_limit_exceeded',
            message: finalConfig.message,
            retryAfter: resetInSeconds
          },
          { 
            status: 429,
            headers: {
              'Retry-After': resetInSeconds.toString(),
              'X-RateLimit-Limit': finalConfig.maxAttempts.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': entry.resetTime.toString()
            }
          }
        )
      }
    }

    return { limited: false }
  }
}

// Specific rate limiters for different auth endpoints
export const loginRateLimit = createRateLimit({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many login attempts. Please wait 15 minutes before trying again.'
})

export const passwordChangeRateLimit = createRateLimit({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many password change attempts. Please wait 1 hour before trying again.'
})

export const passwordResetRequestRateLimit = createRateLimit({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many password reset requests. Please wait 1 hour before requesting again.'
})

export const signupRateLimit = createRateLimit({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many signup attempts. Please wait 1 hour before trying again.'
})

// Email-based rate limiting for sensitive operations
export const emailBasedRateLimit = createRateLimit({
  maxAttempts: 5,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  message: 'Too many attempts for this email. Please wait 24 hours before trying again.'
})

// Helper function to create rate limit response
export function createRateLimitResponse(
  remainingTime: number,
  maxAttempts: number,
  message: string = 'Rate limit exceeded'
): NextResponse {
  const resetInSeconds = Math.ceil(remainingTime / 1000)
  
  return NextResponse.json(
    {
      ok: false,
      error: 'rate_limit_exceeded',
      message,
      retryAfter: resetInSeconds
    },
    { 
      status: 429,
      headers: {
        'Retry-After': resetInSeconds.toString(),
        'X-RateLimit-Limit': maxAttempts.toString(),
        'X-RateLimit-Remaining': '0'
      }
    }
  )
}