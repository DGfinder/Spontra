/**
 * Edge Runtime Compatible Middleware Utilities
 * Lightweight utilities for middleware that runs in Edge Runtime
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Check if a request path should bypass admin authentication
 */
export function isAdminAuthEndpoint(pathname: string): boolean {
  const authEndpoints = [
    '/api/admin/auth/login',
    '/api/admin/auth/logout', 
    '/api/admin/auth/refresh',
    '/api/admin/auth/status'
  ]
  return authEndpoints.some(endpoint => pathname.startsWith(endpoint))
}

/**
 * Basic rate limiting structure for edge runtime
 * Uses simple in-memory map for demonstration
 */
class EdgeRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>()
  
  check(key: string, windowMs: number = 60000, maxRequests: number = 100): {
    allowed: boolean
    limit: number
    remaining: number
    resetTime: Date
  } {
    const now = Date.now()
    const resetTime = Math.ceil(now / windowMs) * windowMs
    const windowKey = `${key}:${Math.floor(now / windowMs)}`
    
    const current = this.requests.get(windowKey) || { count: 0, resetTime }
    
    // Clean old entries periodically
    if (this.requests.size > 1000) {
      for (const [k, v] of this.requests.entries()) {
        if (v.resetTime < now) {
          this.requests.delete(k)
        }
      }
    }
    
    if (current.count >= maxRequests) {
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: new Date(resetTime)
      }
    }
    
    current.count++
    this.requests.set(windowKey, current)
    
    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - current.count),
      resetTime: new Date(resetTime)
    }
  }
}

const rateLimiter = new EdgeRateLimit()

/**
 * Simple rate limiting for API endpoints in edge runtime
 */
export function checkEdgeRateLimit(req: NextRequest): {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: Date
} {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const pathname = new URL(req.url).pathname
  
  // Different limits for different endpoint types
  if (pathname.startsWith('/api/admin')) {
    return rateLimiter.check(`admin:${ip}`, 60000, 50) // 50 req/min for admin
  } else if (pathname.startsWith('/api/auth')) {
    return rateLimiter.check(`auth:${ip}`, 60000, 10) // 10 req/min for auth
  } else if (pathname.startsWith('/api/')) {
    return rateLimiter.check(`api:${ip}`, 60000, 100) // 100 req/min for general API
  }
  
  return rateLimiter.check(`general:${ip}`, 60000, 200) // 200 req/min for general
}

/**
 * Create unauthorized response for admin routes
 */
export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Admin authentication required', code: 'UNAUTHORIZED' },
    { status: 401 }
  )
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
    { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil(retryAfter / 1000).toString()
      }
    }
  )
}

/**
 * Extract client IP from request (edge-compatible)
 */
export function getClientIP(req: NextRequest): string {
  return (
    req.ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  )
}

/**
 * Basic token validation pattern (without crypto dependencies)
 * This is a simplified version for edge runtime
 */
export function isValidTokenFormat(token: string): boolean {
  // Basic JWT format check: header.payload.signature
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}